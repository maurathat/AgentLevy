#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont


@dataclass
class TranscriptSegment:
    start: float
    end: float
    text: str


@dataclass
class TimedWord:
    text: str
    start: float
    end: float


@dataclass
class SubtitleChunk:
    words: list[TimedWord]

    @property
    def start(self) -> float:
        return self.words[0].start

    @property
    def end(self) -> float:
        return self.words[-1].end


TIME_RE = re.compile(r"^(?P<m>\d+):(?P<s>\d{2})\s+(?P<text>.+)$")


def parse_timecode(value: str) -> float:
    minutes, seconds = value.split(":")
    return int(minutes) * 60 + int(seconds)


def load_transcript(path: Path, duration: float) -> list[TranscriptSegment]:
    rows: list[tuple[float, str]] = []
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line:
            continue
        match = TIME_RE.match(line)
        if not match:
            raise ValueError(f"Invalid transcript line: {line}")
        start = parse_timecode(f"{match.group('m')}:{match.group('s')}")
        rows.append((start, match.group("text").strip()))

    segments: list[TranscriptSegment] = []
    for index, (start, text) in enumerate(rows):
        end = rows[index + 1][0] if index + 1 < len(rows) else duration
        segments.append(TranscriptSegment(start=start, end=end, text=text))
    return segments


def normalize_word(word: str) -> str:
    cleaned = word.lower().replace("’", "'")
    cleaned = cleaned.replace("agentlevy", "agent levy")
    cleaned = cleaned.replace("x402", "x 402")
    cleaned = cleaned.replace("0g", "zero g")
    cleaned = re.sub(r"[^a-z0-9]+", "", cleaned)
    return cleaned


def tokenize(text: str) -> list[str]:
    return re.findall(r"\S+", text)


def load_whisper_words(path: Path) -> list[TimedWord]:
    payload = json.loads(path.read_text())
    words: list[TimedWord] = []
    for segment in payload["segments"]:
        for word in segment.get("words", []):
            text = word["word"].strip()
            if not text:
                continue
            words.append(
                TimedWord(
                    text=text,
                    start=float(word["start"]),
                    end=float(word["end"]),
                )
            )
    return words


def fuzzy_score(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    if a in b or b in a:
        return 0.82
    matches = sum(1 for x, y in zip(a, b) if x == y)
    return matches / max(len(a), len(b))


def weighted_fill(words: list[dict], start: float, end: float) -> None:
    if not words:
        return
    weights = []
    for word in words:
        token = word["text"]
        base = max(1, len(re.sub(r"[^\w]+", "", token)))
        if re.search(r"[,.!?;:]$", token):
            base += 2
        weights.append(base)
    total = sum(weights)
    cursor = start
    span = max(0.05, end - start)
    for word, weight in zip(words, weights):
        duration = span * (weight / total)
        word["start"] = cursor
        word["end"] = cursor + duration
        cursor += duration


def align_segment_words(segment: TranscriptSegment, whisper_words: list[TimedWord]) -> list[TimedWord]:
    transcript_tokens = tokenize(segment.text)
    token_rows = [{"text": token, "start": None, "end": None} for token in transcript_tokens]

    window_start = max(0.0, segment.start - 0.6)
    window_end = segment.end + 0.8
    candidates = [w for w in whisper_words if w.end >= window_start and w.start <= window_end]

    cursor = 0
    for token_row in token_rows:
        norm = normalize_word(token_row["text"])
        if not norm:
            continue
        best_idx = None
        best_score = 0.0
        for idx in range(cursor, min(len(candidates), cursor + 8)):
            candidate_norm = normalize_word(candidates[idx].text)
            score = fuzzy_score(norm, candidate_norm)
            if score > best_score:
                best_idx = idx
                best_score = score
        if best_idx is not None and best_score >= 0.72:
            candidate = candidates[best_idx]
            token_row["start"] = candidate.start
            token_row["end"] = candidate.end
            cursor = best_idx + 1

    matched_indexes = [idx for idx, row in enumerate(token_rows) if row["start"] is not None]
    if not matched_indexes:
        weighted_fill(token_rows, segment.start, segment.end)
    else:
        first = matched_indexes[0]
        if first > 0:
            weighted_fill(token_rows[:first], segment.start, token_rows[first]["start"])
        for left, right in zip(matched_indexes, matched_indexes[1:]):
            if right - left > 1:
                weighted_fill(
                    token_rows[left + 1 : right],
                    token_rows[left]["end"],
                    token_rows[right]["start"],
                )
        last = matched_indexes[-1]
        if last < len(token_rows) - 1:
            weighted_fill(token_rows[last + 1 :], token_rows[last]["end"], segment.end)

    timed_words: list[TimedWord] = []
    for row in token_rows:
        start = float(row["start"])
        end = float(row["end"])
        if end <= start:
            end = start + 0.08
        timed_words.append(TimedWord(text=row["text"], start=start, end=end))
    return timed_words


def build_chunks(words: list[TimedWord]) -> list[SubtitleChunk]:
    chunks: list[SubtitleChunk] = []
    current: list[TimedWord] = []
    for index, word in enumerate(words):
        if current:
            gap = word.start - current[-1].end
            text_len = len(" ".join(item.text for item in current))
            if (
                gap > 0.55
                or len(current) >= 9
                or text_len > 64
                or current[-1].text.endswith((".", "!", "?", ":"))
            ):
                chunks.append(SubtitleChunk(words=current))
                current = []
        current.append(word)
        last_in_sentence = word.text.endswith((".", "!", "?")) and len(current) >= 4
        if last_in_sentence:
            chunks.append(SubtitleChunk(words=current))
            current = []
    if current:
        chunks.append(SubtitleChunk(words=current))
    return chunks


def fit_font(font_path: str, words: list[str], max_width: int, max_lines: int) -> tuple[ImageFont.FreeTypeFont, list[list[str]]]:
    for size in range(52, 31, -2):
        font = ImageFont.truetype(font_path, size=size)
        lines = wrap_words(words, font, max_width)
        if len(lines) <= max_lines:
            return font, lines
    font = ImageFont.truetype(font_path, size=30)
    return font, wrap_words(words, font, max_width)


def wrap_words(words: list[str], font: ImageFont.FreeTypeFont, max_width: int) -> list[list[str]]:
    lines: list[list[str]] = []
    current: list[str] = []
    for word in words:
        trial = current + [word]
        width = font.getbbox(" ".join(trial))[2]
        if current and width > max_width:
            lines.append(current)
            current = [word]
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def render_chunk_state(
    chunk: SubtitleChunk,
    active_index: int,
    out_path: Path,
    width: int,
    height: int,
    font_path: str,
) -> None:
    words = [word.text for word in chunk.words]
    font, lines = fit_font(font_path, words, max_width=1180, max_lines=2)
    line_spacing = 16
    token_gap = font.getbbox(" ")[2]

    line_layouts = []
    max_line_width = 0
    word_cursor = 0
    for line_words in lines:
        token_positions = []
        line_width = 0
        for idx, token in enumerate(line_words):
            token_width = font.getbbox(token)[2]
            token_positions.append((token, token_width, word_cursor))
            line_width += token_width
            if idx < len(line_words) - 1:
                line_width += token_gap
            word_cursor += 1
        line_layouts.append((line_width, token_positions))
        max_line_width = max(max_line_width, line_width)

    line_height = font.getbbox("Ag")[3] - font.getbbox("Ag")[1]
    box_padding_x = 28
    box_padding_y = 18
    box_width = max_line_width + box_padding_x * 2
    box_height = len(line_layouts) * line_height + (len(line_layouts) - 1) * line_spacing + box_padding_y * 2
    box_x = (width - box_width) // 2
    box_y = height - box_height - 92

    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(
        (box_x, box_y, box_x + box_width, box_y + box_height),
        radius=26,
        fill=(7, 12, 28, 210),
        outline=(78, 95, 139, 220),
        width=2,
    )

    current_y = box_y + box_padding_y
    for line_width, token_positions in line_layouts:
        current_x = (width - line_width) // 2
        for token, token_width, word_index in token_positions:
            fill = (255, 91, 91, 255) if word_index == active_index else (248, 250, 255, 255)
            shadow_x = current_x + 2
            shadow_y = current_y + 2
            draw.text((shadow_x, shadow_y), token, font=font, fill=(0, 0, 0, 180))
            draw.text((current_x, current_y), token, font=font, fill=fill)
            current_x += token_width + token_gap
        current_y += line_height + line_spacing

    image.save(out_path)


def write_concat_file(starts: list[float], images: list[Path], output_path: Path, video_duration: float, blank: Path) -> None:
    lines: list[str] = []
    blank_abs = blank.resolve()
    if starts and starts[0] > 0.08:
        lines.append(f"file '{blank_abs.as_posix()}'")
        lines.append(f"duration {starts[0]:.6f}")
    for index, image in enumerate(images):
        image_abs = image.resolve()
        lines.append(f"file '{image_abs.as_posix()}'")
        if index + 1 < len(images):
            duration = max(0.05, starts[index + 1] - starts[index])
        else:
            duration = max(0.05, video_duration - starts[index])
        lines.append(f"duration {duration:.6f}")
    if images:
        lines.append(f"file '{images[-1].resolve().as_posix()}'")
    else:
        lines.append(f"file '{blank_abs.as_posix()}'")
        lines.append(f"duration {video_duration:.6f}")
        lines.append(f"file '{blank_abs.as_posix()}'")
    output_path.write_text("\n".join(lines) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--transcript", required=True)
    parser.add_argument("--whisper-json", required=True)
    parser.add_argument("--video-duration", required=True, type=float)
    parser.add_argument("--width", type=int, default=1820)
    parser.add_argument("--height", type=int, default=934)
    parser.add_argument("--out-dir", required=True)
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    frames_dir = out_dir / "subtitle_states"
    frames_dir.mkdir(parents=True, exist_ok=True)

    transcript_segments = load_transcript(Path(args.transcript), args.video_duration)
    whisper_words = load_whisper_words(Path(args.whisper_json))

    all_words: list[TimedWord] = []
    for segment in transcript_segments:
        all_words.extend(align_segment_words(segment, whisper_words))

    chunks = build_chunks(all_words)
    starts: list[float] = []
    images: list[Path] = []
    blank_path = out_dir / "subtitle_blank.png"
    Image.new("RGBA", (args.width, args.height), (0, 0, 0, 0)).save(blank_path)

    font_path = "/System/Library/Fonts/Helvetica.ttc"
    state_index = 0
    for chunk in chunks:
        for word_index, word in enumerate(chunk.words):
            image_path = frames_dir / f"state_{state_index:04d}.png"
            render_chunk_state(
                chunk=chunk,
                active_index=word_index,
                out_path=image_path,
                width=args.width,
                height=args.height,
                font_path=font_path,
            )
            starts.append(word.start)
            images.append(image_path)
            state_index += 1

    concat_path = out_dir / "subtitle_concat.txt"
    write_concat_file(starts, images, concat_path, args.video_duration, blank_path)

    summary = {
        "segments": len(transcript_segments),
        "words": len(all_words),
        "chunks": len(chunks),
        "states": len(images),
        "concat": concat_path.as_posix(),
        "blank": blank_path.as_posix(),
    }
    (out_dir / "subtitle_summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

"""Unit tests for the SM-2 spaced repetition algorithm."""

import pytest
from datetime import datetime, timezone, timedelta
from api.services.lesson_service import sm2_update


def test_first_correct_review_gives_one_day():
    """First successful review (times_seen=0) → 1-day interval."""
    ef, interval, next_review = sm2_update(ease_factor=2.5, interval=1, times_seen=0, quality=4)
    assert interval == 1
    assert ef > 1.3
    assert next_review > datetime.now(timezone.utc)


def test_second_correct_review_gives_six_days():
    """Second successful review (times_seen=1) → 6-day interval."""
    ef, interval, _ = sm2_update(ease_factor=2.5, interval=1, times_seen=1, quality=4)
    assert interval == 6


def test_third_review_uses_ease_factor():
    """Third+ review: interval = round(prev_interval * EF)."""
    ef, interval, _ = sm2_update(ease_factor=2.5, interval=6, times_seen=2, quality=4)
    assert interval == round(6 * 2.5)


def test_failed_recall_resets_interval():
    """Quality < 3 resets interval to 1."""
    _, interval, _ = sm2_update(ease_factor=2.5, interval=10, times_seen=5, quality=1)
    assert interval == 1


def test_ease_factor_increases_on_perfect():
    """Quality 5 (perfect) increases ease factor."""
    old_ef = 2.5
    new_ef, _, _ = sm2_update(ease_factor=old_ef, interval=1, times_seen=0, quality=5)
    assert new_ef > old_ef


def test_ease_factor_decreases_on_difficult():
    """Quality 3 (barely correct) decreases ease factor slightly."""
    old_ef = 2.5
    new_ef, _, _ = sm2_update(ease_factor=old_ef, interval=1, times_seen=0, quality=3)
    assert new_ef < old_ef


def test_ease_factor_minimum_clamped():
    """EF never drops below 1.3 no matter how many poor reviews."""
    ef = 1.3
    for _ in range(20):
        ef, _, _ = sm2_update(ease_factor=ef, interval=1, times_seen=3, quality=0)
    assert ef >= 1.3


def test_next_review_in_future():
    """next_review is always in the future."""
    _, _, next_review = sm2_update(ease_factor=2.5, interval=1, times_seen=0, quality=5)
    assert next_review > datetime.now(timezone.utc)

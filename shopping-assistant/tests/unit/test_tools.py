# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import pytest

from app.agent import (
    DISCOUNT_CODES,
    LOYALTY_POINTS,
    AwardLoyaltyPointsInput,
    award_loyalty_points,
    redeem_discount_code,
)


@pytest.fixture(autouse=True)
def reset_global_state():
    # Reset DISCOUNT_CODES redeemed_by sets
    for code in DISCOUNT_CODES:
        DISCOUNT_CODES[code]["redeemed_by"] = set()
    # Reset LOYALTY_POINTS balances
    LOYALTY_POINTS.clear()
    LOYALTY_POINTS.update(
        {
            "user123": 150,
            "alice": 300,
            "bob": 50,
            "student": 0,
        }
    )


def test_redeem_discount_success():
    res = redeem_discount_code("WELCOME50", "alice")
    assert "Success" in res
    assert "50%" in res
    redeemed_by: set[str] = DISCOUNT_CODES["WELCOME50"]["redeemed_by"]
    assert "alice" in redeemed_by


def test_redeem_discount_duplicate():
    # First redemption succeeds
    redeem_discount_code("WELCOME50", "alice")
    # Second redemption by same user fails
    res2 = redeem_discount_code("WELCOME50", "alice")
    assert "Error" in res2
    assert "already been redeemed" in res2
    # Redemption by another user fails (globally single-use)
    res3 = redeem_discount_code("WELCOME50", "bob")
    assert "Error" in res3
    assert "already been redeemed" in res3


def test_redeem_discount_invalid_code():
    res = redeem_discount_code("INVALID10", "alice")
    assert "Error" in res
    assert "invalid" in res.lower()


def test_redeem_discount_unregistered_user():
    res = redeem_discount_code("WELCOME50", "unknown_user")
    assert "Error" in res
    assert "not registered" in res


def test_award_loyalty_points_success():
    inp = AwardLoyaltyPointsInput(user_id="alice", purchase_amount=24.50)
    res = award_loyalty_points(inp)
    assert "Success" in res
    # 24.5 * 10 = 245 points. Original was 300. New balance = 545.
    assert "245" in res
    assert "545" in res
    assert LOYALTY_POINTS["alice"] == 545


def test_award_loyalty_points_negative_or_zero():
    # Test zero
    inp_zero = AwardLoyaltyPointsInput(user_id="alice", purchase_amount=0.0)
    res_zero = award_loyalty_points(inp_zero)
    assert "Error" in res_zero
    assert "greater than zero" in res_zero

    # Test negative
    inp_neg = AwardLoyaltyPointsInput(user_id="alice", purchase_amount=-10.0)
    res_neg = award_loyalty_points(inp_neg)
    assert "Error" in res_neg
    assert "greater than zero" in res_neg


def test_award_loyalty_points_unregistered_user():
    inp = AwardLoyaltyPointsInput(user_id="unknown_user", purchase_amount=50.0)
    res = award_loyalty_points(inp)
    assert "Error" in res
    assert "not registered" in res


def test_award_loyalty_points_excessive():
    inp = AwardLoyaltyPointsInput(user_id="alice", purchase_amount=12000.0)
    res = award_loyalty_points(inp)
    assert "Error" in res
    assert "exceeds the maximum limit" in res

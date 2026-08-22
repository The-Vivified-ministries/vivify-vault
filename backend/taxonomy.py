import json
import os


DEFAULT_CATEGORY_SUBCATEGORIES: dict[str, list[str]] = {
    "Theological": [
        "Soteriology",
        "Christology",
        "Hermeneutics",
        "Apologetics",
        "Pneumatology",
        "Ecclesiology",
        "Eschatology",
        "Character of God",
        "Theological Questions",
    ],
    "Real Life": [
        "Negative Emotions",
        "Positive Emotions",
        "Relationships",
        "Financials",
        "Perspective",
        "Christian Conduct",
        "Addictions",
        "Purpose",
    ],
    "Spirituals": [
        "Prayer",
        "Bible Study",
        "Spiritual Growth",
        "Consecration",
        "Faith",
        "Sexual Purity",
        "Devotional Fervour",
        "Worship",
        "Angels",
        "Healings",
        "The Believer's Authority",
        "Spiritual Leading",
    ],
    "Bible Series": [
        "Colossians",
        "Galatians",
        "1 John",
        "1 Thessalonians",
        "James",
        "Bible Characters",
        "Philippians",
    ],
    "Events": [
        "Crazy Love Conference",
        "Audacity Conference",
        "Ignite Conference",
        "Illuminate Conference",
        "LOL Conference",
        "Vision Summit",
        "Old Q&A's",
        "Cross-overs",
        "Confessions",
    ],
}


def _load_category_subcategories() -> dict[str, list[str]]:
    configured = os.getenv("CATEGORY_SUBCATEGORIES")
    if not configured:
        return DEFAULT_CATEGORY_SUBCATEGORIES

    try:
        value = json.loads(configured)
    except json.JSONDecodeError as exc:
        raise ValueError(
            "CATEGORY_SUBCATEGORIES must be a valid JSON object"
        ) from exc

    if not isinstance(value, dict) or not all(
        isinstance(category, str)
        and isinstance(subcategories, list)
        and all(isinstance(subcategory, str) for subcategory in subcategories)
        for category, subcategories in value.items()
    ):
        raise ValueError(
            "CATEGORY_SUBCATEGORIES must map category names to string arrays"
        )

    return value


CATEGORY_SUBCATEGORIES = _load_category_subcategories()


def get_categories() -> list[str]:
    return list(CATEGORY_SUBCATEGORIES)


def get_subcategories(category: str) -> list[str]:
    return list(CATEGORY_SUBCATEGORIES.get(category, []))


def is_valid_pair(category: str, subcategory: str) -> bool:
    return subcategory in CATEGORY_SUBCATEGORIES.get(category, [])
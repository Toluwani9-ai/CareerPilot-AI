"""Utilities for loading and querying the ESCO classification files.

This module provides occupation and skill information to CareerPilot AI.
The scoring and recommendation decisions remain inside skills_engine.py.

This service uses the ESCO classification of the European Commission.
"""

from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Dict, List, Optional, Set

# Define ESCO data paths
BASE_DIRECTORY = Path(__file__).resolve().parent
ESCO_DIRECTORY = BASE_DIRECTORY / "data" / "esco"

# Path to the ESCO occupations CSV file
OCCUPATIONS_FILE = ESCO_DIRECTORY / "occupations_en.csv"
SKILLS_FILE = ESCO_DIRECTORY / "skills_en.csv"
RELATIONS_FILE = ESCO_DIRECTORY / "occupationSkillRelations_en.csv"


def normalise_text(value: str) -> str:
    """Convert text into a consistent format for searching and comparison."""
    value = value.casefold().strip()
    value = re.sub(r"[^a-z0-9+#.\s/-]", " ", value)
    value = re.sub(r"\s+", " ", value)
    return value


def split_labels(value: str) -> List[str]:
    """Split ESCO alternative-label fields into individual labels."""
    if not value:
        return []

    # ESCO label lists are normally separated using new lines.
    labels = re.split(r"[\n\r]+", value)

    return [
        label.strip()
        for label in labels
        if label and label.strip()
    ]

# ESCO data repository
class EscoRepository:
    """Loads ESCO occupations, skills and occupation-skill relationships."""

    def __init__(self) -> None:
        self.occupations: Dict[str, Dict[str, object]] = {}
        self.skills: Dict[str, Dict[str, object]] = {}
        self.occupation_skills: Dict[str, List[Dict[str, str]]] = {}

        self._loaded = False

    def _validate_files(self) -> None:
        required_files = [
            OCCUPATIONS_FILE,
            SKILLS_FILE,
            RELATIONS_FILE,
        ]

        missing_files = [
            str(path)
            for path in required_files
            if not path.exists()
        ]

        if missing_files:
            missing_text = "\n".join(missing_files)
            raise FileNotFoundError(
                "The following ESCO files could not be found:\n"
                f"{missing_text}"
            )

    @staticmethod
    def _read_csv(path: Path):
        with path.open(
            mode="r",
            encoding="utf-8-sig",
            newline="",
        ) as csv_file:
            yield from csv.DictReader(csv_file)

    def load(self) -> None:
        """Load ESCO data once and keep it in memory."""
        if self._loaded:
            return

        self._validate_files()
        self._load_occupations()
        self._load_skills()
        self._load_relations()

        self._loaded = True

    # Read occupations
    def _load_occupations(self) -> None:
        for row in self._read_csv(OCCUPATIONS_FILE):
            occupation_uri = row.get("conceptUri", "").strip()
            preferred_label = row.get("preferredLabel", "").strip()

            if not occupation_uri or not preferred_label:
                continue

            alternative_labels = split_labels(row.get("altLabels", ""))

            self.occupations[occupation_uri] = {
                "uri": occupation_uri,
                "preferred_label": preferred_label,
                "normalised_label": normalise_text(preferred_label),
                "alternative_labels": alternative_labels,
                "normalised_alternative_labels": [
                    normalise_text(label)
                    for label in alternative_labels
                ],
                "description": row.get("description", "").strip(),
                "definition": row.get("definition", "").strip(),
                "isco_group": row.get("iscoGroup", "").strip(),
                "code": row.get("code", "").strip(),
            }

    def _load_skills(self) -> None:
        for row in self._read_csv(SKILLS_FILE):
            skill_uri = row.get("conceptUri", "").strip()
            preferred_label = row.get("preferredLabel", "").strip()

            if not skill_uri or not preferred_label:
                continue

            alternative_labels = split_labels(row.get("altLabels", ""))

            self.skills[skill_uri] = {
                "uri": skill_uri,
                "preferred_label": preferred_label,
                "normalised_label": normalise_text(preferred_label),
                "alternative_labels": alternative_labels,
                "normalised_alternative_labels": [
                    normalise_text(label)
                    for label in alternative_labels
                ],
                "skill_type": row.get("skillType", "").strip(),
                "reuse_level": row.get("reuseLevel", "").strip(),
                "description": row.get("description", "").strip(),
                "definition": row.get("definition", "").strip(),
            }

       # Read relations CSV
    def _load_relations(self) -> None:
        for row in self._read_csv(RELATIONS_FILE):
            occupation_uri = row.get("occupationUri", "").strip()
            skill_uri = row.get("skillUri", "").strip()

            if not occupation_uri or not skill_uri:
                continue

            relationship = {
                "skill_uri": skill_uri,
                "skill_label": row.get("skillLabel", "").strip(),
                "relation_type": row.get("relationType", "").strip(),
                "skill_type": row.get("skillType", "").strip(),
            }

            self.occupation_skills.setdefault(
                occupation_uri,
                [],
            ).append(relationship)

    def get_statistics(self) -> Dict[str, int]:
        """Return useful dataset totals."""
         # Get dataset totals
        self.load()

        relationship_count = sum(
            len(relations)
            for relations in self.occupation_skills.values()
        )

        return {
            "occupations": len(self.occupations),
            "skills": len(self.skills),
            "occupation_skill_relationships": relationship_count,
        }

    def search_occupations(
        self,
        query: str,
        limit: int = 10,
    ) -> List[Dict[str, object]]:
        """Find occupations whose labels contain the supplied query."""
        self.load()

        normalised_query = normalise_text(query)

        if not normalised_query:
            return []

        results: List[Dict[str, object]] = []

        for occupation in self.occupations.values():
            preferred_label = str(occupation["normalised_label"])
            alternative_labels = occupation[
                "normalised_alternative_labels"
            ]

            exact_match = normalised_query == preferred_label
            preferred_contains = normalised_query in preferred_label
            alternative_contains = any(
                normalised_query in label
                for label in alternative_labels
            )

            if not (
                exact_match
                or preferred_contains
                or alternative_contains
            ):
                continue

            if exact_match:
                relevance = 3
            elif preferred_contains:
                relevance = 2
            else:
                relevance = 1

            results.append(
                {
                    "uri": occupation["uri"],
                    "preferred_label": occupation["preferred_label"],
                    "description": occupation["description"],
                    "isco_group": occupation["isco_group"],
                    "relevance": relevance,
                }
            )

        results.sort(
            key=lambda result: (
                -int(result["relevance"]),
                str(result["preferred_label"]).casefold(),
            )
        )

        return results[:limit]

    def match_occupation_from_text(
        self,
        text: str,
    ) -> Optional[Dict[str, object]]:
        """Find the most specific ESCO occupation label mentioned in free text."""
        self.load()

        normalised_text = f" {normalise_text(text)} "
        candidates: List[tuple[int, int, Dict[str, object]]] = []

        for occupation in self.occupations.values():
            labels = [
                str(occupation["preferred_label"]),
                *[str(label) for label in occupation["alternative_labels"]],
            ]

            for label in labels:
                normalised_label = normalise_text(label)
                if not normalised_label:
                    continue

                # Match whole occupation phrases inside the job description.
                pattern = rf"(?<![a-z0-9]){re.escape(normalised_label)}(?![a-z0-9])"
                if re.search(pattern, normalised_text):
                    # Prefer longer, more specific labels. Preferred labels win ties.
                    is_preferred = int(
                        normalised_label == str(occupation["normalised_label"])
                    )
                    candidates.append(
                        (len(normalised_label), is_preferred, occupation)
                    )
                    break

        if not candidates:
            return None

        candidates.sort(key=lambda item: (item[0], item[1]), reverse=True)
        return candidates[0][2]


    def get_occupation(
        self,
        occupation_uri: str,
    ) -> Optional[Dict[str, object]]:
        self.load()
        return self.occupations.get(occupation_uri)

    def get_occupation_skills(
        self,
        occupation_uri: str,
        relation_type: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        """Return skills connected to an occupation."""
        self.load()

        relationships = self.occupation_skills.get(
            occupation_uri,
            [],
        )

        results: List[Dict[str, str]] = []

        for relationship in relationships:
            if (
                relation_type
                and relationship["relation_type"].casefold()
                != relation_type.casefold()
            ):
                continue

            skill_uri = relationship["skill_uri"]
            skill_information = self.skills.get(skill_uri, {})

            results.append(
                {
                    "skill_uri": skill_uri,
                    "skill_label": (
                        str(skill_information.get("preferred_label", ""))
                        or relationship["skill_label"]
                    ),
                    "relation_type": relationship["relation_type"],
                    "skill_type": relationship["skill_type"],
                    "description": str(

                        # Add skill description
                        skill_information.get("description", "")
                    ),
                }
            )

        results.sort(
            key=lambda result: (
                result["relation_type"] != "essential",
                result["skill_label"].casefold(),
            )
        )
        
        # Return results
        return results

    def get_occupation_skill_labels(
        self,
        occupation_uri: str,
        relation_type: Optional[str] = None,
    ) -> Set[str]:
        """Return normalised skill labels for an occupation."""
        skills = self.get_occupation_skills(
            occupation_uri=occupation_uri,
            relation_type=relation_type,
        )
        
          # Return normalized labels
        return {
            normalise_text(skill["skill_label"])
            for skill in skills
            if skill["skill_label"]
        }


esco_repository = EscoRepository()
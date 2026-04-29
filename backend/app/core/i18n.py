from __future__ import annotations

from collections.abc import Mapping

SUPPORTED_LANGUAGES = {"ro", "en", "de"}
DEFAULT_LANGUAGE = "de"

TRANSLATIONS: dict[str, dict[str, str]] = {
    "ro": {
        # generic http
        "errors.http.bad_request": "Cererea este invalidă.",
        "errors.http.unauthorized": "Nu ești autentificat.",
        "errors.http.forbidden": "Nu ai permisiunea necesară.",
        "errors.http.not_found": "Resursa nu a fost găsită.",
        "errors.http.conflict": "Resursa este în conflict cu datele existente.",
        "errors.http.too_many_requests": "Prea multe încercări. Te rugăm să încerci din nou mai târziu.",

        # validation / internal
        "errors.validation.invalid_request": "Datele trimise sunt invalide.",
        "errors.internal": "A apărut o eroare internă.",

        # database
        "errors.db.constraint_violation": "Operația nu a putut fi finalizată din cauza unei constrângeri de date.",
        "errors.db.unique_violation": "Există deja o înregistrare cu aceste date unice.",
        "errors.db.foreign_key_violation": "Referința către o resursă asociată este invalidă.",
        "errors.db.not_null_violation": "Un câmp obligatoriu lipsește.",
    },

    "en": {
        # generic http
        "errors.http.bad_request": "The request is invalid.",
        "errors.http.unauthorized": "You are not authenticated.",
        "errors.http.forbidden": "You do not have permission to perform this action.",
        "errors.http.not_found": "The resource was not found.",
        "errors.http.conflict": "The resource conflicts with existing data.",
        "errors.http.too_many_requests": "Too many attempts. Please try again later.",

        # validation / internal
        "errors.validation.invalid_request": "The submitted data is invalid.",
        "errors.internal": "An internal error occurred.",

        # database
        "errors.db.constraint_violation": "The operation could not be completed because of a data constraint violation.",
        "errors.db.unique_violation": "A record with these unique values already exists.",
        "errors.db.foreign_key_violation": "The reference to a related resource is invalid.",
        "errors.db.not_null_violation": "A required field is missing.",
    },

    "de": {
        # generic http
        "errors.http.bad_request": "Die Anfrage ist ungültig.",
        "errors.http.unauthorized": "Du bist nicht authentifiziert.",
        "errors.http.forbidden": "Du hast keine Berechtigung für diese Aktion.",
        "errors.http.not_found": "Die Ressource wurde nicht gefunden.",
        "errors.http.conflict": "Die Ressource steht im Konflikt mit vorhandenen Daten.",
        "errors.http.too_many_requests": "Zu viele Versuche. Bitte versuche es später erneut.",

        # validation / internal
        "errors.validation.invalid_request": "Die gesendeten Daten sind ungültig.",
        "errors.internal": "Ein interner Fehler ist aufgetreten.",

        # database
        "errors.db.constraint_violation": "Der Vorgang konnte aufgrund einer Datenbeschränkung nicht abgeschlossen werden.",
        "errors.db.unique_violation": "Ein Datensatz mit diesen eindeutigen Werten existiert bereits.",
        "errors.db.foreign_key_violation": "Die Referenz auf eine verknüpfte Ressource ist ungültig.",
        "errors.db.not_null_violation": "Ein Pflichtfeld fehlt.",
    },
}


def normalize_language(value: str | None) -> str:
    if not value:
        return DEFAULT_LANGUAGE

    lowered = value.lower().strip()

    for part in lowered.split(","):
        token = part.split(";")[0].strip()
        if not token:
            continue

        base = token.split("-")[0]
        if base in SUPPORTED_LANGUAGES:
            return base

    return DEFAULT_LANGUAGE


def translate(code: str, language: str, fallback: str | None = None) -> str:
    lang = normalize_language(language)

    lang_messages = TRANSLATIONS.get(lang, {})
    if code in lang_messages:
        return lang_messages[code]

    fallback_messages = TRANSLATIONS[DEFAULT_LANGUAGE]
    if code in fallback_messages:
        return fallback_messages[code]

    return fallback or code


def get_language_from_headers(headers: Mapping[str, str]) -> str:
    return normalize_language(headers.get("accept-language"))
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

        # validation / internal
        "errors.validation.invalid_request": "Datele trimise sunt invalide.",
        "errors.internal": "A apărut o eroare internă.",

        # database
        "errors.db.constraint_violation": "Operația nu a putut fi finalizată din cauza unei constrângeri de date.",
        "errors.db.unique_violation": "Există deja o înregistrare cu aceste date unice.",
        "errors.db.foreign_key_violation": "Referința către o resursă asociată este invalidă.",
        "errors.db.not_null_violation": "Un câmp obligatoriu lipsește.",

        # users
        "users.full_name.blank": "Numele complet nu poate fi gol.",
        "users.role.invalid": "Rolul utilizatorului este invalid.",
        "users.status.invalid": "Statusul utilizatorului este invalid.",
        "users.email.blank": "Emailul nu poate fi gol.",
        "users.unique_code.blank": "Codul unic nu poate fi gol.",
        "users.username.blank": "Username-ul nu poate fi gol.",
        "users.shift_number.blank": "Numărul de tură nu poate fi gol.",
        "users.password_hash.blank": "Hash-ul parolei nu poate fi gol.",
        "users.rejection_reason.blank": "Motivul respingerii nu poate fi gol.",

        # employee profiles
        "employee_profiles.first_name.blank": "Prenumele nu poate fi gol.",
        "employee_profiles.last_name.blank": "Numele de familie nu poate fi gol.",
        "employee_profiles.phone.blank": "Numărul de telefon nu poate fi gol.",
        "employee_profiles.address.blank": "Adresa nu poate fi goală.",
        "employee_profiles.position.blank": "Poziția nu poate fi goală.",
        "employee_profiles.department.blank": "Departamentul nu poate fi gol.",
        "employee_profiles.iban.blank": "IBAN-ul nu poate fi gol.",
        "employee_profiles.emergency_contact_name.blank": "Numele persoanei de contact în caz de urgență nu poate fi gol.",
        "employee_profiles.emergency_contact_phone.blank": "Telefonul persoanei de contact în caz de urgență nu poate fi gol.",

        # documents
        "documents.file_name.blank": "Numele fișierului nu poate fi gol.",
        "documents.file_path.blank": "Calea fișierului nu poate fi goală.",
        "documents.mime_type.blank": "Tipul MIME nu poate fi gol.",
        "documents.title.blank": "Titlul documentului nu poate fi gol.",
        "documents.file_size.invalid": "Dimensiunea fișierului este invalidă.",

        # vehicles
        "vehicles.brand.blank": "Marca vehiculului nu poate fi goală.",
        "vehicles.model.blank": "Modelul vehiculului nu poate fi gol.",
        "vehicles.license_plate.blank": "Numărul de înmatriculare nu poate fi gol.",
        "vehicles.year.invalid": "Anul vehiculului este invalid.",
        "vehicles.current_mileage.invalid": "Kilometrajul nu poate fi negativ.",
        "vehicles.vin.blank": "VIN-ul nu poate fi gol dacă este completat.",

        # vehicle assignments
        "vehicle_assignments.date_range.invalid": "Data de încheiere nu poate fi înaintea datei de început.",
        "vehicle_assignments.status.invalid": "Statusul alocării nu este compatibil cu data de încheiere.",
        "vehicle_assignments.notes.blank": "Notițele alocării nu pot fi goale.",
        "vehicle_assignments.active_vehicle.conflict": "Vehiculul are deja o alocare activă.",
        "vehicle_assignments.active_user.conflict": "Utilizatorul are deja un vehicul alocat activ.",

        # vehicle issues
        "vehicle_issues.need_service_in_km.invalid": "Valoarea pentru service în kilometri nu poate fi negativă.",
        "vehicle_issues.estimated_cost.invalid": "Costul estimat este invalid.",
        "vehicle_issues.final_cost.invalid": "Costul final este invalid.",
        "vehicle_issues.scheduled_location.blank": "Locația programării nu poate fi goală.",
        "vehicle_issues.dashboard_checks.blank": "Câmpul pentru verificările din bord nu poate fi gol.",
        "vehicle_issues.other_problems.blank": "Câmpul pentru alte probleme nu poate fi gol.",
        "vehicle_issues.resolution_notes.blank": "Notițele de rezolvare nu pot fi goale.",
        "vehicle_issues.scheduled_requires_datetime": "Pentru statusul programat, data și ora programării sunt obligatorii.",
        "vehicle_issues.scheduled_location_requires_datetime": "Locația programării necesită dată și oră de programare.",
        "vehicle_issues.resolved_at.invalid": "Data rezolvării este invalidă.",

        # handover reports
        "vehicle_handover_reports.mileage_start.invalid": "Kilometrajul de început este invalid.",
        "vehicle_handover_reports.mileage_end.invalid": "Kilometrajul de final este invalid.",
        "vehicle_handover_reports.mileage_range.invalid": "Kilometrajul de final nu poate fi mai mic decât cel de început.",
        "vehicle_handover_reports.dashboard_warnings_start.blank": "Avertizările de bord la început nu pot fi goale.",
        "vehicle_handover_reports.dashboard_warnings_end.blank": "Avertizările de bord la final nu pot fi goale.",
        "vehicle_handover_reports.damage_notes_start.blank": "Notițele de daune la început nu pot fi goale.",
        "vehicle_handover_reports.damage_notes_end.blank": "Notițele de daune la final nu pot fi goale.",
        "vehicle_handover_reports.notes_start.blank": "Notițele de început nu pot fi goale.",
        "vehicle_handover_reports.notes_end.blank": "Notițele de final nu pot fi goale.",

        # leave requests
        "leave_requests.date_range.invalid": "Data de sfârșit nu poate fi înaintea datei de început.",
        "leave_requests.reason.blank": "Motivul nu poate fi gol dacă este completat.",
        "leave_requests.rejection_reason.blank": "Motivul respingerii nu poate fi gol dacă este completat.",
        "leave_requests.review_fields.invalid": "Câmpurile de review nu corespund statusului cererii de concediu.",
    },
    "en": {
        # generic http
        "errors.http.bad_request": "The request is invalid.",
        "errors.http.unauthorized": "You are not authenticated.",
        "errors.http.forbidden": "You do not have permission to perform this action.",
        "errors.http.not_found": "The resource was not found.",
        "errors.http.conflict": "The resource conflicts with existing data.",

        # validation / internal
        "errors.validation.invalid_request": "The submitted data is invalid.",
        "errors.internal": "An internal error occurred.",

        # database
        "errors.db.constraint_violation": "The operation could not be completed because of a data constraint violation.",
        "errors.db.unique_violation": "A record with these unique values already exists.",
        "errors.db.foreign_key_violation": "The reference to a related resource is invalid.",
        "errors.db.not_null_violation": "A required field is missing.",

        # users
        "users.full_name.blank": "Full name cannot be blank.",
        "users.role.invalid": "User role is invalid.",
        "users.status.invalid": "User status is invalid.",
        "users.email.blank": "Email cannot be blank.",
        "users.unique_code.blank": "Unique code cannot be blank.",
        "users.username.blank": "Username cannot be blank.",
        "users.shift_number.blank": "Shift number cannot be blank.",
        "users.password_hash.blank": "Password hash cannot be blank.",
        "users.rejection_reason.blank": "Rejection reason cannot be blank.",

        # employee profiles
        "employee_profiles.first_name.blank": "First name cannot be blank.",
        "employee_profiles.last_name.blank": "Last name cannot be blank.",
        "employee_profiles.phone.blank": "Phone cannot be blank.",
        "employee_profiles.address.blank": "Address cannot be blank.",
        "employee_profiles.position.blank": "Position cannot be blank.",
        "employee_profiles.department.blank": "Department cannot be blank.",
        "employee_profiles.iban.blank": "IBAN cannot be blank.",
        "employee_profiles.emergency_contact_name.blank": "Emergency contact name cannot be blank.",
        "employee_profiles.emergency_contact_phone.blank": "Emergency contact phone cannot be blank.",

        # documents
        "documents.file_name.blank": "File name cannot be blank.",
        "documents.file_path.blank": "File path cannot be blank.",
        "documents.mime_type.blank": "MIME type cannot be blank.",
        "documents.title.blank": "Document title cannot be blank.",
        "documents.file_size.invalid": "File size is invalid.",

        # vehicles
        "vehicles.brand.blank": "Vehicle brand cannot be blank.",
        "vehicles.model.blank": "Vehicle model cannot be blank.",
        "vehicles.license_plate.blank": "License plate cannot be blank.",
        "vehicles.year.invalid": "Vehicle year is invalid.",
        "vehicles.current_mileage.invalid": "Current mileage cannot be negative.",
        "vehicles.vin.blank": "VIN cannot be blank when provided.",

        # vehicle assignments
        "vehicle_assignments.date_range.invalid": "End date cannot be earlier than start date.",
        "vehicle_assignments.status.invalid": "Assignment status is not compatible with the end date.",
        "vehicle_assignments.notes.blank": "Assignment notes cannot be blank.",
        "vehicle_assignments.active_vehicle.conflict": "The vehicle already has an active assignment.",
        "vehicle_assignments.active_user.conflict": "The user already has an active vehicle assignment.",

        # vehicle issues
        "vehicle_issues.need_service_in_km.invalid": "The service-in-km value cannot be negative.",
        "vehicle_issues.estimated_cost.invalid": "Estimated cost is invalid.",
        "vehicle_issues.final_cost.invalid": "Final cost is invalid.",
        "vehicle_issues.scheduled_location.blank": "Scheduled location cannot be blank.",
        "vehicle_issues.dashboard_checks.blank": "Dashboard checks cannot be blank.",
        "vehicle_issues.other_problems.blank": "Other problems cannot be blank.",
        "vehicle_issues.resolution_notes.blank": "Resolution notes cannot be blank.",
        "vehicle_issues.scheduled_requires_datetime": "A scheduled issue must have a scheduled date and time.",
        "vehicle_issues.scheduled_location_requires_datetime": "Scheduled location requires a scheduled date and time.",
        "vehicle_issues.resolved_at.invalid": "Resolved date is invalid.",

        # handover reports
        "vehicle_handover_reports.mileage_start.invalid": "Start mileage is invalid.",
        "vehicle_handover_reports.mileage_end.invalid": "End mileage is invalid.",
        "vehicle_handover_reports.mileage_range.invalid": "End mileage cannot be lower than start mileage.",
        "vehicle_handover_reports.dashboard_warnings_start.blank": "Start dashboard warnings cannot be blank.",
        "vehicle_handover_reports.dashboard_warnings_end.blank": "End dashboard warnings cannot be blank.",
        "vehicle_handover_reports.damage_notes_start.blank": "Start damage notes cannot be blank.",
        "vehicle_handover_reports.damage_notes_end.blank": "End damage notes cannot be blank.",
        "vehicle_handover_reports.notes_start.blank": "Start notes cannot be blank.",
        "vehicle_handover_reports.notes_end.blank": "End notes cannot be blank.",

        # leave requests
        "leave_requests.date_range.invalid": "End date cannot be earlier than start date.",
        "leave_requests.reason.blank": "Reason cannot be blank when provided.",
        "leave_requests.rejection_reason.blank": "Rejection reason cannot be blank when provided.",
        "leave_requests.review_fields.invalid": "Review fields do not match the leave request status.",
    },
    "de": {
        # generic http
        "errors.http.bad_request": "Die Anfrage ist ungültig.",
        "errors.http.unauthorized": "Du bist nicht authentifiziert.",
        "errors.http.forbidden": "Du hast keine Berechtigung für diese Aktion.",
        "errors.http.not_found": "Die Ressource wurde nicht gefunden.",
        "errors.http.conflict": "Die Ressource steht im Konflikt mit vorhandenen Daten.",

        # validation / internal
        "errors.validation.invalid_request": "Die gesendeten Daten sind ungültig.",
        "errors.internal": "Ein interner Fehler ist aufgetreten.",

        # database
        "errors.db.constraint_violation": "Der Vorgang konnte aufgrund einer Datenbeschränkung nicht abgeschlossen werden.",
        "errors.db.unique_violation": "Ein Datensatz mit diesen eindeutigen Werten existiert bereits.",
        "errors.db.foreign_key_violation": "Die Referenz auf eine verknüpfte Ressource ist ungültig.",
        "errors.db.not_null_violation": "Ein Pflichtfeld fehlt.",

        # users
        "users.full_name.blank": "Der vollständige Name darf nicht leer sein.",
        "users.role.invalid": "Die Benutzerrolle ist ungültig.",
        "users.status.invalid": "Der Benutzerstatus ist ungültig.",
        "users.email.blank": "Die E-Mail darf nicht leer sein.",
        "users.unique_code.blank": "Der eindeutige Code darf nicht leer sein.",
        "users.username.blank": "Der Benutzername darf nicht leer sein.",
        "users.shift_number.blank": "Die Schichtnummer darf nicht leer sein.",
        "users.password_hash.blank": "Der Passwort-Hash darf nicht leer sein.",
        "users.rejection_reason.blank": "Der Ablehnungsgrund darf nicht leer sein.",

        # employee profiles
        "employee_profiles.first_name.blank": "Der Vorname darf nicht leer sein.",
        "employee_profiles.last_name.blank": "Der Nachname darf nicht leer sein.",
        "employee_profiles.phone.blank": "Die Telefonnummer darf nicht leer sein.",
        "employee_profiles.address.blank": "Die Adresse darf nicht leer sein.",
        "employee_profiles.position.blank": "Die Position darf nicht leer sein.",
        "employee_profiles.department.blank": "Die Abteilung darf nicht leer sein.",
        "employee_profiles.iban.blank": "Die IBAN darf nicht leer sein.",
        "employee_profiles.emergency_contact_name.blank": "Der Name der Notfallkontaktperson darf nicht leer sein.",
        "employee_profiles.emergency_contact_phone.blank": "Die Telefonnummer der Notfallkontaktperson darf nicht leer sein.",

        # documents
        "documents.file_name.blank": "Der Dateiname darf nicht leer sein.",
        "documents.file_path.blank": "Der Dateipfad darf nicht leer sein.",
        "documents.mime_type.blank": "Der MIME-Typ darf nicht leer sein.",
        "documents.title.blank": "Der Dokumenttitel darf nicht leer sein.",
        "documents.file_size.invalid": "Die Dateigröße ist ungültig.",

        # vehicles
        "vehicles.brand.blank": "Die Fahrzeugmarke darf nicht leer sein.",
        "vehicles.model.blank": "Das Fahrzeugmodell darf nicht leer sein.",
        "vehicles.license_plate.blank": "Das Kennzeichen darf nicht leer sein.",
        "vehicles.year.invalid": "Das Baujahr des Fahrzeugs ist ungültig.",
        "vehicles.current_mileage.invalid": "Der Kilometerstand darf nicht negativ sein.",
        "vehicles.vin.blank": "Die VIN darf nicht leer sein, wenn sie angegeben wird.",

        # vehicle assignments
        "vehicle_assignments.date_range.invalid": "Das Enddatum darf nicht vor dem Startdatum liegen.",
        "vehicle_assignments.status.invalid": "Der Status der Zuweisung passt nicht zum Enddatum.",
        "vehicle_assignments.notes.blank": "Die Notizen der Zuweisung dürfen nicht leer sein.",
        "vehicle_assignments.active_vehicle.conflict": "Das Fahrzeug hat bereits eine aktive Zuweisung.",
        "vehicle_assignments.active_user.conflict": "Der Benutzer hat bereits eine aktive Fahrzeugzuweisung.",

        # vehicle issues
        "vehicle_issues.need_service_in_km.invalid": "Der Kilometerwert für den Service darf nicht negativ sein.",
        "vehicle_issues.estimated_cost.invalid": "Die geschätzten Kosten sind ungültig.",
        "vehicle_issues.final_cost.invalid": "Die Endkosten sind ungültig.",
        "vehicle_issues.scheduled_location.blank": "Der Terminort darf nicht leer sein.",
        "vehicle_issues.dashboard_checks.blank": "Das Feld für Armaturenbrett-Prüfungen darf nicht leer sein.",
        "vehicle_issues.other_problems.blank": "Das Feld für weitere Probleme darf nicht leer sein.",
        "vehicle_issues.resolution_notes.blank": "Die Lösungsnotizen dürfen nicht leer sein.",
        "vehicle_issues.scheduled_requires_datetime": "Ein geplanter Vorgang muss ein Termin-Datum und eine Uhrzeit haben.",
        "vehicle_issues.scheduled_location_requires_datetime": "Der Terminort erfordert ein Termin-Datum und eine Uhrzeit.",
        "vehicle_issues.resolved_at.invalid": "Das Abschlussdatum ist ungültig.",

        # handover reports
        "vehicle_handover_reports.mileage_start.invalid": "Der Startkilometerstand ist ungültig.",
        "vehicle_handover_reports.mileage_end.invalid": "Der Endkilometerstand ist ungültig.",
        "vehicle_handover_reports.mileage_range.invalid": "Der Endkilometerstand darf nicht kleiner als der Startkilometerstand sein.",
        "vehicle_handover_reports.dashboard_warnings_start.blank": "Die Start-Warnhinweise dürfen nicht leer sein.",
        "vehicle_handover_reports.dashboard_warnings_end.blank": "Die End-Warnhinweise dürfen nicht leer sein.",
        "vehicle_handover_reports.damage_notes_start.blank": "Die Start-Schadensnotizen dürfen nicht leer sein.",
        "vehicle_handover_reports.damage_notes_end.blank": "Die End-Schadensnotizen dürfen nicht leer sein.",
        "vehicle_handover_reports.notes_start.blank": "Die Startnotizen dürfen nicht leer sein.",
        "vehicle_handover_reports.notes_end.blank": "Die Endnotizen dürfen nicht leer sein.",

        # leave requests
        "leave_requests.date_range.invalid": "Das Enddatum darf nicht vor dem Startdatum liegen.",
        "leave_requests.reason.blank": "Der Grund darf nicht leer sein, wenn er angegeben wird.",
        "leave_requests.rejection_reason.blank": "Der Ablehnungsgrund darf nicht leer sein, wenn er angegeben wird.",
        "leave_requests.review_fields.invalid": "Die Prüfungsfelder passen nicht zum Status des Urlaubsantrags.",
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
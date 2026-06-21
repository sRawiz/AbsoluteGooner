# VNDB.org API v2 (Kana) — Full Reference

> Comprehensive reference document compiled from the official VNDB API v2 ("Kana") documentation at `https://api.vndb.org/kana` and its live schema endpoint `https://api.vndb.org/kana/schema`.
> This single document covers **every section** of the official docs: introduction, usage terms, data types, authentication, all simple GET endpoints, all database query (`POST`) endpoints with their full filter/field lists, list management endpoints, HTTP response codes, tips & troubleshooting, the enumeration schema (languages, platforms, media, staff roles), supported external-link sites, and the full change log.
>
> **API base URL:** `https://api.vndb.org/kana`
> **Sandbox/testing base URL:** `https://beta.vndb.org/api/kana` (see https://beta.vndb.org/about-sandbox)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Usage Terms](#2-usage-terms)
3. [Common Data Types](#3-common-data-types)
4. [User Authentication](#4-user-authentication)
5. [Simple Requests](#5-simple-requests)
   - 5.1 [GET /schema](#51-get-schema)
   - 5.2 [GET /stats](#52-get-stats)
   - 5.3 [GET /user](#53-get-user)
   - 5.4 [GET /authinfo](#54-get-authinfo)
6. [Database Querying — API Structure](#6-database-querying--api-structure)
   - 6.1 [Query format](#61-query-format)
   - 6.2 [Response format](#62-response-format)
   - 6.3 [Filters](#63-filters)
7. [POST /vn](#7-post-vn)
8. [POST /release](#8-post-release)
9. [POST /producer](#9-post-producer)
10. [POST /character](#10-post-character)
11. [POST /staff](#11-post-staff)
12. [POST /tag](#12-post-tag)
13. [POST /trait](#13-post-trait)
14. [POST /quote](#14-post-quote)
15. [List Management](#15-list-management)
    - 15.1 [POST /ulist](#151-post-ulist)
    - 15.2 [GET /ulist_labels](#152-get-ulist_labels)
    - 15.3 [PATCH /ulist/\<id\>](#153-patch-ulistid)
    - 15.4 [PATCH /rlist/\<id\>](#154-patch-rlistid)
    - 15.5 [DELETE /ulist/\<id\>](#155-delete-ulistid)
    - 15.6 [DELETE /rlist/\<id\>](#156-delete-rlistid)
16. [HTTP Response Codes](#16-http-response-codes)
17. [Tips & Troubleshooting](#17-tips--troubleshooting)
18. [Change Log](#18-change-log)
19. [Appendix A — Live Schema: Enumerations](#19-appendix-a--live-schema-enumerations)
20. [Appendix B — Live Schema: Supported External Links](#20-appendix-b--live-schema-supported-external-links)
21. [Appendix C — Live Schema: API Field Map](#21-appendix-c--live-schema-api-field-map)

---

## 1. Introduction

This document describes the HTTPS API used to query information from the [VNDB](https://vndb.org/) (Visual Novel Database) and to manage user lists.

This is the **second-generation** API ("Kana"), which replaces the old TCP-based API (formerly at `https://api.vndb.org/nyan`).

- **Production API endpoint:** `https://api.vndb.org/kana`
- **Sandbox endpoint** (for testing/development): `https://beta.vndb.org/api/kana`

---

## 2. Usage Terms

- The service is **free for non-commercial use**, provided on a best-effort basis with no stability guarantees.
- Data obtained through the API is subject to VNDB's [Data License](https://vndb.org/d17#4).
- **Rate limits:**
  - Up to **200 requests per 5 minutes**.
  - Up to **1 second of execution time per minute**.
  - Any single request taking longer than **3 seconds** is aborted.
  - These limits are meant to be generous for most applications; contact the maintainers if they're insufficient.
- The API does **not** expose all VNDB functionality. Features such as forums, database editing, and account creation are not available through the API. Missing functionality can be requested via the [forums](https://vndb.org/t/db), the [issue tracker](https://code.blicky.net/yorhel/vndb/issues), or by emailing `contact@vndb.org`.

---

## 3. Common Data Types

### vndbid
An identifier for a database entry, formatted as a number with a one- or two-character prefix, e.g.:
- `v17` → a visual novel (https://vndb.org/v17)
- `sf190` → a screenshot (https://vndb.org/img/sf190)

The API always returns vndbids as JSON **strings**. Filters also accept bare integers when the prefix is unambiguous from context.

### Release date
Represented as JSON strings in one of these formats, depending on known precision:
- `"YYYY-MM-DD"`
- `"YYYY-MM"`
- `"YYYY"`
- `"TBA"` — unspecified future date
- In filters only, the special values `"unknown"` and `"today"` are also supported.

**Important ordering rule:** Partial dates sort **after** complete dates within the same year/month.
- `"2022"` sorts after `"2022-12"`, which sorts after `"2022-12-31"`.
- This means `["released", "<", "2022-01"]` *also* matches all complete dates in January 2022.
- And `["released", "=", "2022"]` matches **only** entries whose date is literally `"2022"` — not other dates within that year.

### Enumeration types
Several database fields use a fixed integer or string from a limited set of possible values. These are either documented inline for the field, or listed in the [schema JSON](#51-get-schema) (see [Appendix A](#19-appendix-a--live-schema-enumerations) for the current live values).

---

## 4. User Authentication

Most endpoints work without authentication. User-related actions — especially **list management** — require authentication tied to a VNDB user account.

### Cookie auth
The API understands cookies from the `vndb.org` domain. Scripts running on the site only need `XMLHttpRequest.withCredentials` or the Fetch API `credentials` option set.

### Token auth
For all other use cases, use **token authentication**.

- Obtain a token: profile → "Applications" tab, or go directly to `https://vndb.org/u/tokens`.
- Token format: `xxxx-xxxxx-xxxxx-xxxx-xxxxx-xxxxx-xxxx` (lowercase z-base-32 characters; dashes optional).
- Send it via the `Authorization` header using the `Token` scheme:

```
Authorization: Token hsoo-ybws4-j8yb9-qxkw-5obay-px8to-bfyk
```

- An invalid token returns **HTTP 401**.
- Use [GET /authinfo](#54-get-authinfo) to validate a token and inspect what it grants.

---

## 5. Simple Requests

### 5.1 GET /schema

Returns a JSON object (`https://api.vndb.org/kana/schema`) with metadata about API objects: enumeration values, which fields are queryable, and supported external links.

- This data changes infrequently — safe to use for **code generation** or **dynamic introspection**.
- The `url_format` attribute of external links is **informational only** — do not use it to construct URLs; the API has custom per-site URL formatting rules.
- See [Appendix A](#19-appendix-a--live-schema-enumerations), [Appendix B](#20-appendix-b--live-schema-supported-external-links), and [Appendix C](#21-appendix-c--live-schema-api-field-map) for the live snapshot of this schema.

### 5.2 GET /stats

Returns overall database statistics.

```bash
curl https://api.vndb.org/kana/stats
```

```json
{
  "chars": 112347,
  "producers": 14789,
  "releases": 91490,
  "staff": 27929,
  "tags": 2783,
  "traits": 3115,
  "vn": 36880
}
```

### 5.3 GET /user

Look up users by ID or username.

**Query parameters:**

| Param | Description |
|---|---|
| `q` | User ID or username to look up. Can be repeated to look up multiple users in one call. |
| `fields` | List of extra fields to select. `id` and `username` are always included and should not be listed. |

The response is an object keyed by each given `q` value. Each value is either `null` (not found) or an object with:

| Field | Type | Description |
|---|---|---|
| `id` | string | Format `"u123"`. |
| `username` | string | |
| `lengthvotes` | integer | Number of play-time votes submitted by the user. |
| `lengthvotes_sum` | integer | Sum of the user's play-time votes, in minutes. |

Notes: strings that look like user IDs are never valid usernames, so lookup is unambiguous. Username matching is case-insensitive.

```bash
curl 'https://api.vndb.org/kana/user?q=NoUserWithThisNameExists&q=AYO&q=u3'
```

```json
{
  "AYO": { "id": "u3", "username": "ayo" },
  "NoUserWithThisNameExists": null,
  "u3": { "id": "u3", "username": "ayo" }
}
```

```bash
curl 'https://api.vndb.org/kana/user?q=yorhel&fields=lengthvotes,lengthvotes_sum'
```

```json
{
  "yorhel": {
    "id": "u2",
    "lengthvotes": 9,
    "lengthvotes_sum": 9685,
    "username": "Yorhel"
  }
}
```

### 5.4 GET /authinfo

Validates an API token and returns information about it.

**Response fields:**

| Field | Type | Description |
|---|---|---|
| `id` | string | User ID. |
| `username` | string | |
| `permissions` | array of strings | Permissions granted to this token. |

**Currently implemented permissions:**

| Permission | Grants |
|---|---|
| `listread` | Read access to private labels and entries in the user's VN list. |
| `listwrite` | Write access to the user's VN list. |

```bash
curl https://api.vndb.org/kana/authinfo \
    --header 'Authorization: token cdhy-bqy1q-6zobu-8w9k-xobxh-wzz4o-84fn'
```

```json
{
  "id": "u3",
  "username": "ayo",
  "permissions": ["listread"]
}
```

---

## 6. Database Querying — API Structure

Searching and fetching database entries uses a custom JSON query format. Queries are sent as **`POST`** requests (the `QUERY` HTTP method will be supported once it has wider tooling support).

### 6.1 Query format

A query is a JSON object:

```json
{
  "filters": [],
  "fields": "",
  "sort": "id",
  "reverse": false,
  "results": 10,
  "page": 1,
  "user": null,
  "count": false,
  "compact_filters": false,
  "normalized_filters": false
}
```

All members are optional; the values above are defaults.

| Field | Type | Description |
|---|---|---|
| `filters` | array/string | Determines which items to fetch. See [Filters](#63-filters). |
| `fields` | string | Comma-separated list of fields to fetch. Supports dot notation for nested objects (e.g. `"image.url"`) and bracket grouping (e.g. `"image{id,url,dims}"` ≡ `"image.id, image.url, image.dims"`). **Every field of interest must be explicitly listed — no wildcards.** Listing a nested object without sub-fields (e.g. `image` alone) is an error. The top-level `id` field is always included and need not be listed. |
| `sort` | string | Field to sort on; valid values depend on the endpoint (documented per-endpoint below). |
| `reverse` | boolean | `true` to sort descending. |
| `results` | integer | Results per page, **max 100**. Can be `0` if you only want `count` / `compact_filters` / `normalized_filters` without actual results. |
| `page` | integer | Page number, starting at 1. See [Pagination](#pagination). |
| `user` | string | User ID. Mainly used for `POST /ulist`; also sets the default user for the visual novel `label` filter. Defaults to the authenticated user. |
| `count` | boolean | Include the `count` field in the response. **Has a real performance cost** — avoid unless needed. |
| `compact_filters` | boolean | Include the `compact_filters` field in the response. |
| `normalized_filters` | boolean | Include the `normalized_filters` field in the response. |

### 6.2 Response format

```json
{
  "results": [],
  "more": false,
  "count": 1,
  "compact_filters": "",
  "normalized_filters": []
}
```

| Field | Description |
|---|---|
| `results` | Array of result objects. |
| `more` | If `true`, incrementing `page` and repeating the query yields more results. Cheaper than relying on `count`. |
| `count` | Present only if `"count":true` was requested. Total number of matching entries. |
| `compact_filters` | Present only if `"compact_filters":true` was requested. Compact string form of the given filters. |
| `normalized_filters` | Present only if `"normalized_filters":true` was requested. Normalized JSON form of the given filters. |

### 6.3 Filters

**Simple predicates** are 3-element JSON arrays: `[filter_name, operator, value]`, e.g. `["id", "=", "v17"]`.

- All filters support `=` and `!=`.
- Filters that support ordering also accept `>=`, `>`, `<=`, `<`.

**Compound predicates** combine simple predicates using `and`/`or`: a JSON array whose first element is `"and"` or `"or"`, followed by **two or more** other predicates (which may themselves be compound).

**Full example:**

```json
[ "and"
, [ "or"
  , [ "lang", "=", "en" ]
  , [ "lang", "=", "de" ]
  , [ "lang", "=", "fr" ]
  ]
, [ "olang", "!=", "ja" ]
, [ "release", "=", [ "and"
    , [ "released", ">=", "2020-01-01" ]
    , [ "producer", "=", [ "id", "=", "p30" ] ]
    ]
  ]
]
```

**Compact string representation:** Filters can also be written as a compact string (used in the advanced-search web UI URLs), and the API accepts this format directly as the `"filters"` value. The API can convert between JSON and compact form bidirectionally.

Compact form of the example above:
```
03132gen2gde2gfr3hjaN180272_0c2vQN6830u
```
Seen live at: `https://vndb.org/v?f=03132gen2gde2gfr3hjaN180272_0c2vQN6830u`

To convert a compact string back to JSON:

```bash
curl https://api.vndb.org/kana/vn --header 'Content-Type: application/json' --data '{
    "filters": "03132gen2gde2gfr3hjaN180272_0c2vQN6830u",
    "normalized_filters": true
}'
```

> Note: the website's advanced-search editor UI doesn't support every filter type — unsupported ones show as "Unrecognized filter" blocks but still work correctly via the API.
>
> **Limit:** maximum **1000 filter predicates** per request (added 2025-05-02).

#### Filter flags

Used throughout the per-endpoint filter tables below:

| Flag | Meaning |
|---|---|
| `o` | Ordering operators (`>`, `<`, `>=`, `<=`) can be used. |
| `n` | Accepts `null` as a value. |
| `m` | A single entry can match multiple values (e.g. a VN available in both English and Japanese matches both `["lang","=","en"]` and `["lang","=","ja"]`). |
| `i` | Inverting/negating this filter is **not** necessarily equivalent to inverting the match set — often because the filter implies "the information must be known" as a precondition. Exact semantics vary per filter. |

⚠️ **Be careful with boolean algebra on `m`/`i` filters.** E.g. `["or",["minage","=",0],["minage","!=",0]]` does **not** match every release — only releases where `minage` is actually known.

---

## 7. POST /vn

Query visual novel entries.

```bash
curl https://api.vndb.org/kana/vn --header 'Content-Type: application/json' --data '{
    "filters": ["id", "=", "v17"],
    "fields": "title, image.url"
}'
```

**Sort values:** `id`, `title`, `released`, `rating`, `votecount`, `searchrank`

### 7.1 Filters

| Name | Flags | Description |
|---|---|---|
| `id` | o | vndbid |
| `search` | m | String search; matches VN titles, aliases, and release titles (same algorithm as the site). |
| `lang` | m | Language availability. |
| `olang` | | Original language. |
| `platform` | m | Platform availability. |
| `length` | o | Play time estimate, integer 1 (Very short) – 5 (Very long). Uses length-vote average when available, else falls back to the entry's `length` field. |
| `released` | o, n | Release date. |
| `rating` | o, i | Bayesian rating, integer 10–100. |
| `votecount` | o | Integer, number of votes. |
| `has_description` | | Only accepts integer `1` (can be negated with `!=`). |
| `has_anime` | | Same pattern as `has_description`. |
| `has_screenshot` | | Same pattern as `has_description`. |
| `has_review` | | Same pattern as `has_description`. |
| `devstatus` | | Development status, integer. See `devstatus` field below. |
| `tag` | m | Tags applied to this VN — **also matches parent tags**. See note below. |
| `dtag` | m | Tags applied **directly** to this VN — does **not** match parent tags. |
| `anime_id` | | Integer, AniDB anime identifier. |
| `label` | m | User labels applied to this VN. Accepts a 2-element array `[user_id, label_id]`. When authenticated or `"user"` is set, a bare label ID is also accepted. |
| `release` | m | Match VNs with ≥1 release matching the given [release filters](#8-post-release). |
| `character` | m | Match VNs with ≥1 character matching the given [character filters](#10-post-character). |
| `staff` | m | Match VNs with ≥1 staff member matching the given [staff filters](#11-post-staff). |
| `developer` | m | Match VNs developed by producers matching [producer filters](#9-post-producer). |

**`tag` / `dtag` value format:** either a plain tag ID, or a 3-element array `[tag_id, max_spoiler_level, min_tag_level]` where spoiler level ∈ {0,1,2} and tag level ∈ [0,3].
- Example: `["tag","=",["g505",2,1.2]]` → VNs with [Donkan Protagonist](https://vndb.org/g505) rated ≥1.2 at any spoiler level.
- A bare ID like `["tag","=","g505"]` is equivalent to `["tag","=",["g505",0,0]]`.

### 7.2 Fields

| Field | Type | Description |
|---|---|---|
| `id` | vndbid | |
| `title` | string | Main title as displayed on the site, typically romanized. |
| `alttitle` | string\|null | Alternative title, typically same as `title` but in original script. |
| `titles` | array of objects | Full title list; always ≥1 entry. |
| `titles.lang` | string | Language. Each language appears at most once. |
| `titles.title` | string | Title in original script. |
| `titles.latin` | string\|null | Romanized version of `title`. |
| `titles.official` | boolean | |
| `titles.main` | boolean | Whether this is the "main" title. Exactly one entry has this set, and its `lang` matches the VN's `olang`. |
| `aliases` | array of strings | |
| `olang` | string | Language the VN was originally written in. |
| `devstatus` | integer | `0` = Finished, `1` = In development, `2` = Cancelled. |
| `released` | date\|null | |
| `languages` | array of strings | Languages this VN is available in (excludes machine translations). |
| `platforms` | array of strings | Platforms this VN is available on. |
| `image` | object\|null | |
| `image.id` | string | Image identifier. |
| `image.url` | string | |
| `image.dims` | [int, int] | Width, height in pixels. |
| `image.sexual` | number 0–2 | Average sexual-content flagging vote. |
| `image.violence` | number 0–2 | Average violence flagging vote. |
| `image.votecount` | integer | Number of image flagging votes. |
| `image.thumbnail` | string | Thumbnail URL. |
| `image.thumbnail_dims` | [int, int] | Thumbnail width, height. |
| `length` | integer\|null | Rough length estimate 1 (very short) – 5 (very long). Fallback only — prefer `length_minutes`. |
| `length_minutes` | integer\|null | Average of user-submitted play times, in minutes. |
| `length_votes` | integer | Number of submitted play times. |
| `description` | string\|null | May contain [formatting codes](https://vndb.org/d9#4). |
| `average` | number\|null | Raw vote average 10–100 (cached, may lag up to ~1 hour). |
| `rating` | number\|null | Bayesian rating 10–100 (cached). |
| `votecount` | integer | Cached vote count. |
| `screenshots` | array of objects | Possibly empty. |
| `screenshots.*` | | Same sub-fields as `image.*`. |
| `screenshots.release.*` | object | Release object — any [release field](#8-post-release). Tip: select only `release.id` here if you need more than a few release fields, then fetch release details separately (avoids duplication). |
| `relations` | array of objects | VNs directly related to this entry. |
| `relations.relation` | string | Relation type. |
| `relations.relation_official` | boolean | |
| `relations.*` | | Any [VN field](#7-post-vn), recursively. |
| `tags` | array of objects | Only **directly applied** tags (no parent tags). |
| `tags.rating` | number | Tag rating, (0, 3]. |
| `tags.spoiler` | integer | 0, 1, or 2. |
| `tags.lie` | boolean | |
| `tags.*` | | Any [tag field](#12-post-tag). Tip: select only `tags.id` when querying many VNs, then fetch tag details separately. |
| `developers` | array of objects | Producers with a "developer" role on a release linked to this VN. |
| `developers.*` | | Any [producer field](#9-post-producer). |
| `editions` | array of objects | Possibly empty. |
| `editions.eid` | integer | Edition ID — local to this VN, **not stable across edits**; used only to organize the staff listing. |
| `editions.lang` | string\|null | |
| `editions.name` | string | English label identifying this edition. |
| `editions.official` | boolean | |
| `staff` | array of objects | Possibly empty. |
| `staff.eid` | integer\|null | Edition ID, or `null` if staff worked on the "original" version. |
| `staff.role` | string | See `enums.staff_role` in [Appendix A](#19-appendix-a--live-schema-enumerations). |
| `staff.note` | string\|null | |
| `staff.*` | | Any [staff field](#11-post-staff). |
| `va` | array of objects | Voice-actor relations. Same actor can repeat for different characters; same character can repeat for different actors. |
| `va.note` | string\|null | |
| `va.staff.*` | | Voice actor — any [staff field](#11-post-staff). |
| `va.character.*` | | Voiced character — any [character field](#10-post-character). |
| `extlinks` | array | Links to external sites. Same structure as the release `extlinks` field (see [§8.2](#82-fields)). |

---

## 8. POST /release

**Sort values:** `id`, `title`, `released`, `searchrank`

### 8.1 Filters

| Name | Flags | Description |
|---|---|---|
| `id` | o | vndbid |
| `search` | m | String search. |
| `lang` | m | Match on available languages. |
| `platform` | m | Match on available platforms. |
| `released` | o | Release date. |
| `resolution` | o, i | Image resolution in pixels. Value: 2-element int array `[width, height]`. E.g. `["resolution","<=",[640,480]]` matches resolutions ≤ 640×480. |
| `resolution_aspect` | o, i | Like `resolution`, but additionally requires matching aspect ratio. |
| `minage` | o, n, i | Integer 0–18, age rating. |
| `medium` | m, n | String. |
| `voiced` | n | Integer — see `voiced` field below. |
| `engine` | n | String. |
| `rtype` | m | String — see `vns.rtype` field. If nested inside a VN filter, matches the `rtype` for that particular VN; otherwise matches `rtype` of any linked VN. |
| `extlink` | m | Match on external links — see note below. |
| `drm` | m | String, DRM implementation. |
| `image` | m, n | String — see `images.type` field. *(Added 2026-01-10.)* |
| `patch` | | Only accepts integer `1`. |
| `freeware` | | Same pattern as `patch`. |
| `uncensored` | i | Same pattern as `patch`. |
| `official` | | Same pattern as `patch`. |
| `has_ero` | | Same pattern as `patch`. |
| `vn` | m | Match releases linked to ≥1 VN matching given [VN filters](#7-post-vn). |
| `producer` | m | Match releases with ≥1 producer matching given [producer filters](#9-post-producer). |
| `animation` | — | *Undocumented filter (exists but not documented by VNDB).* |

**`extlink` filter — accepted value forms:**
1. Site name only: `["extlink","=","steam"]` → all releases with a Steam ID.
2. `[site_name, remote_id]`: `["extlink","=",["steam",702050]]` → matches the Saya no Uta Steam release. Remote ID can be int or string (numeric strings accepted too).
3. A full URL: `["extlink","=","https://store.steampowered.com/app/702050/"]` — equivalent to form 2.

An error is returned if the site is unknown or the URL format isn't recognized. See [Appendix B](#20-appendix-b--live-schema-supported-external-links) for the current list of supported sites.

### 8.2 Fields

| Field | Type | Description |
|---|---|---|
| `id` | vndbid | |
| `title` | string | Main title, typically romanized. |
| `alttitle` | string\|null | |
| `languages` | array of objects | Languages this release is available in. Exactly one is the "main" language, used to pick `title`/`alttitle`. |
| `languages.lang` | string | Each appears at most once. |
| `languages.title` | string\|null | Title in original script; `null` ⇒ same as the main language's title. |
| `languages.latin` | string\|null | Romanized `title`. |
| `languages.mtl` | boolean | Machine translation? |
| `languages.main` | boolean | Used to determine the "main" title? |
| `platforms` | array of strings | |
| `media` | array of objects | |
| `media.medium` | string | |
| `media.qty` | integer | `0` if unknown/not applicable (e.g. "internet download"). |
| `vns` | array of objects | VNs this release is linked to. |
| `vns.rtype` | string | `"trial"`, `"partial"`, or `"complete"`. |
| `vns.*` | | Any [VN field](#7-post-vn). |
| `producers` | array of objects | |
| `producers.developer` | boolean | |
| `producers.publisher` | boolean | |
| `producers.*` | | Any [producer field](#9-post-producer). |
| `images` | array of objects | Possibly empty. |
| `images.*` | | Same `image.*` sub-fields as VN (see §7.2). |
| `images.type` | string | One of `"pkgfront"`, `"pkgback"`, `"pkgcontent"`, `"pkgside"`, `"pkgmed"`, `"dig"`. |
| `images.vn` | vndbid\|null | Which VN this image applies to — usually `null`; relevant only for bundle releases linked to multiple VNs. |
| `images.languages` | array\|null | Languages this image is valid for, or `null` if valid for all of the release's languages. |
| `images.photo` | boolean | |
| `released` | date | |
| `minage` | integer\|null | Age rating. |
| `patch` | boolean | |
| `freeware` | boolean | |
| `uncensored` | boolean\|null | |
| `official` | boolean | |
| `has_ero` | boolean | |
| `resolution` | null \| `"non-standard"` \| [int, int] | |
| `engine` | string\|null | |
| `voiced` | integer\|null | `1` = not voiced, `2` = only ero scenes voiced, `3` = partially voiced, `4` = fully voiced. |
| `notes` | string\|null | May contain [formatting codes](https://vndb.org/d9#4). |
| `gtin` | string\|null | JAN/EAN/UPC code. |
| `catalog` | string\|null | Catalog number. |
| `extlinks` | array of objects | External site links — mirrors what's shown on the release page (may include redundant/auto-derived entries). |
| `extlinks.url` | string | |
| `extlinks.label` | string | English human-readable label. |
| `extlinks.name` | string | Internal site identifier (for localization / parsing); subject to change over time. |
| `extlinks.id` | string | Remote identifier; falls back to the URL if the site has no clean identifier format. |

> **Missing:** `animation` field is not currently documented (filter only).

---

## 9. POST /producer

**Sort values:** `id`, `name`, `searchrank`

### 9.1 Filters

| Name | Flags | Description |
|---|---|---|
| `id` | o | vndbid |
| `search` | m | String search. |
| `lang` | | Language. |
| `type` | | Producer type — see `type` field below. |
| `extlink` | m | Match on external links (same mechanics as the [release `extlink` filter](#81-filters)). |

### 9.2 Fields

| Field | Type | Description |
|---|---|---|
| `id` | vndbid | |
| `name` | string | |
| `original` | string\|null | Name in original script. |
| `aliases` | array of strings | |
| `lang` | string | Primary language. |
| `type` | string | `"co"` = company, `"in"` = individual, `"ng"` = amateur group. |
| `description` | string\|null | May contain [formatting codes](https://vndb.org/d9#4). |
| `extlinks` | array | Same structure as the release `extlinks` field. |

> **Missing:** producer `relations` are not currently exposed.

---

## 10. POST /character

**Sort values:** `id`, `name`, `searchrank`

### 10.1 Filters

| Name | Flags | Description |
|---|---|---|
| `id` | o | vndbid |
| `search` | m | String search. |
| `role` | m | String — see `vns.role` field. Nested inside a VN filter ⇒ matches that VN's role; otherwise matches role on any linked VN. |
| `blood_type` | | String. |
| `sex` | | String. |
| `sex_spoil` | | String. |
| `gender` | | String. |
| `gender_spoil` | | String. |
| `height` | o, n, i | Integer, cm. |
| `weight` | o, n, i | Integer, kg. |
| `bust` | o, n, i | Integer, cm. |
| `waist` | o, n, i | Integer, cm. |
| `hips` | o, n, i | Integer, cm. |
| `cup` | o, n, i | String, cup size. |
| `age` | o, n, i | Integer. |
| `trait` | m | Traits applied to this character — **also matches parent traits**. |
| `dtrait` | m | Traits applied **directly** — does not match parent traits. |
| `birthday` | n | 2-int array `[month, day]`. `day` can be `0` to match "born sometime in this month". |
| `seiyuu` | m | Match characters voiced by matching [staff filters](#11-post-staff). Note: VA info is VN-specific, but this filter doesn't currently correlate against a parent VN filter when nested. |
| `vn` | m | Match characters linked to VNs matching [VN filters](#7-post-vn). |

**`trait` / `dtrait` value format:** plain trait ID, or `[trait_id, max_spoiler_level]` (no rating concept, unlike tags).

### 10.2 Fields

| Field | Type | Description |
|---|---|---|
| `id` | vndbid | |
| `name` | string | |
| `original` | string\|null | Name in original script. |
| `aliases` | array of strings | |
| `description` | string\|null | May contain [formatting codes](https://vndb.org/d9#4). |
| `image.*` | object\|null | Same sub-fields as VN `image` (minus `thumbnail`/`thumbnail_dims` — character images are capped at 256×300px currently). |
| `blood_type` | string\|null | `"a"`, `"b"`, `"ab"`, or `"o"`. |
| `height` | integer\|null | cm. |
| `weight` | integer\|null | kg. |
| `bust` | integer\|null | cm. |
| `waist` | integer\|null | cm. |
| `hips` | integer\|null | cm. |
| `cup` | string\|null | `"AAA"`, `"AA"`, or a single letter. |
| `age` | integer\|null | Years. |
| `birthday` | [int, int]\|null | `[month, day]`. |
| `sex` | [string, string]\|null | `[apparent (non-spoiler), real (spoiler)]`. Each: `null`, `"m"`, `"f"`, `"b"` (both), or `"n"` (sexless). |
| `gender` | [string, string]\|null | `[non-spoiler, spoiler]` gender. Each: `null`, `"m"`, `"f"`, `"o"` (non-binary), or `"a"` (ambiguous). |
| `vns` | array of objects | VNs this character appears in. Same VN may repeat (once per release) with different spoiler level/role. |
| `vns.spoiler` | integer | |
| `vns.role` | string | `"main"` (protagonist), `"primary"` (main cast), `"side"`, or `"appears"`. |
| `vns.*` | | Any [VN field](#7-post-vn). |
| `vns.release.*` | object\|null | Specific release this character appears in — any [release field](#8-post-release). |
| `traits` | array of objects | Possibly empty. |
| `traits.spoiler` | integer | 0, 1, or 2. |
| `traits.lie` | boolean | |
| `traits.*` | | Any [trait field](#13-post-trait). |

> **Missing:** `gender` (general, non-VN-scoped), `instances`, and detailed voice-actor cross-reference are not currently fully exposed per the official docs notes.

---

## 11. POST /staff

> **Important conceptual note:** Staff have **two kinds of identifiers**:
> - The main **staff ID** — uniquely identifies a *person* (what a staff page represents).
> - Every staff **alias** has its own ID (`aid`), referenced by other entries to record which name/alias was used. Aliases have no dedicated page on the site but are exposed here to support linking VN/character credits to specific staff names.
>
> This endpoint queries staff **names**, not staff **entries** — a person with multiple aliases will appear **once per alias** in results. This is usually what you want when searching/browsing. It is **not** what you want when fetching detailed info about a specific staff entry — use the `ismain` filter to get at most one result per person:

```bash
curl https://api.vndb.org/kana/staff --header 'Content-Type: application/json' --data '{
    "filters": ["and", ["ismain", "=", 1], ["id", "=", "s81"] ],
    "fields": "lang,aliases{name,latin,ismain},description,extlinks{url,label}"
}'
```

**Sort values:** `id`, `name`, `searchrank`

### 11.1 Filters

| Name | Flags | Description |
|---|---|---|
| `id` | o | vndbid |
| `aid` | | Integer, alias identifier. |
| `search` | m | String search. |
| `lang` | | Language. |
| `gender` | | Gender. |
| `role` | m | `"seiyuu"` or any value from `enums.staff_role`. Nested inside a VN filter ⇒ matches that VN's role; otherwise any linked VN. |
| `extlink` | m | Match on external links (same mechanics as the release filter). |
| `ismain` | | Only accepts integer `1`. |

### 11.2 Fields

| Field | Type | Description |
|---|---|---|
| `id` | vndbid | |
| `aid` | integer | Alias ID. |
| `ismain` | boolean | Whether `name`/`original` represent the staff entry's main name. |
| `name` | string | Possibly romanized name. |
| `original` | string\|null | Name in original script. |
| `lang` | string | Staff's primary language. |
| `gender` | string\|null | `"m"` or `"f"`. |
| `description` | string\|null | May contain [formatting codes](https://vndb.org/d9#4). |
| `extlinks` | array | Same structure as the release `extlinks` field. |
| `aliases` | array of objects | All names used by this person. |
| `aliases.aid` | integer | |
| `aliases.name` | string | Name in original script. |
| `aliases.latin` | string\|null | Romanized version. |
| `aliases.ismain` | boolean | Whether this is the "main" alias. |

---

## 12. POST /tag

**Sort values:** `id`, `name`, `vn_count`, `searchrank`

### 12.1 Filters

| Name | Flags | Description |
|---|---|---|
| `id` | o | vndbid |
| `search` | m | String search. |
| `category` | | String — see `category` field. |

### 12.2 Fields

| Field | Type | Description |
|---|---|---|
| `id` | vndbid | |
| `name` | string | |
| `aliases` | array of strings | |
| `description` | string | May contain [formatting codes](https://vndb.org/d9#4). |
| `category` | string | `"cont"` (content), `"ero"` (sexual content), `"tech"` (technical tags). |
| `searchable` | boolean | |
| `applicable` | boolean | |
| `vn_count` | integer | Number of VNs tagged with this (including via child tags). |

> **Missing:** No way to fetch parent/child tag relationships via the API — tags form a DAG rather than a simple tree, making this non-trivial to expose efficiently.

---

## 13. POST /trait

**Sort values:** `id`, `name`, `char_count`, `searchrank`

### 13.1 Filters

| Name | Flags | Description |
|---|---|---|
| `id` | o | vndbid |
| `search` | m | String search. |

### 13.2 Fields

| Field | Type | Description |
|---|---|---|
| `id` | vndbid | |
| `name` | string | Trait names aren't always self-describing — always display alongside their `group_name`. |
| `aliases` | array of strings | |
| `description` | string | May contain [formatting codes](https://vndb.org/d9#4). |
| `searchable` | boolean | |
| `applicable` | boolean | |
| `sexual` | boolean | *(Added 2025-06-02.)* |
| `group_id` | vndbid | Top-level parent trait group. |
| `group_name` | string | |
| `char_count` | integer | Number of characters with this trait, including via child traits. |

---

## 14. POST /quote

Query visual novel quotes.

**Sort values:** `id`, `score`

**Random quote (footer-style algorithm):**

```bash
curl https://api.vndb.org/kana/quote --header 'Content-Type: application/json' --data '{
    "fields": "vn{id,title},character{id,name},quote",
    "filters": [ "random", "=", 1 ]
}'
```

**All quotes from a VN, sorted by score (descending):**

```bash
curl https://api.vndb.org/kana/quote --header 'Content-Type: application/json' --data '{
    "fields": "character{id,name},quote,score",
    "filters": [ "vn", "=", [ "id", "=", "v5" ] ],
    "sort": "score",
    "reverse": true
}'
```

### 14.1 Filters

| Name | Flags | Description |
|---|---|---|
| `id` | o | vndbid |
| `vn` | | Match quotes from VN(s) matching [VN filters](#7-post-vn). |
| `character` | | Match quotes from character(s) matching [character filters](#10-post-character). |
| `random` | | Only accepts integer `1`. Matches exactly one random quote from all quotes with a positive score. |

> The `random` filter doesn't really combine with other filters — adding more filters risks zero results. You *can* get more than one random quote with multiple `random` filters inside an `or` clause, but duplicates can still occur. See [Random entry](#random-entry) for alternative strategies.

### 14.2 Fields

| Field | Type | Description |
|---|---|---|
| `id` | vndbid | |
| `quote` | string | |
| `score` | integer | |
| `vn.*` | | Any [VN field](#7-post-vn). |
| `character.*` | | Any [character field](#10-post-character). |

---

## 15. List Management

### 15.1 POST /ulist

Fetch a user's VN list. Works like `POST /vn`, except it **requires** the `"user"` parameter and returns a different response structure. All [VN filters](#7-post-vn) are usable here.

> Deleted-from-database VNs that still appear on a user's list on the website are **not** returned via this API.

**Sort values:** `id`, `title`, `released`, `rating`, `votecount`, `voted`, `vote`, `added`, `lastmod`, `started`, `finished`, `searchrank`

**Example — Yorhel's top 10 voted VNs:**

```bash
curl https://api.vndb.org/kana/ulist --header 'Content-Type: application/json' --data '{
    "user": "u2",
    "fields": "id, vote, vn.title",
    "filters": [ "label", "=", 7 ],
    "sort": "vote",
    "reverse": true,
    "results": 10
}'
```

#### Fields

| Field | Type | Description |
|---|---|---|
| `id` | vndbid | VN ID. |
| `added` | integer | Unix timestamp. |
| `voted` | integer\|null | Unix timestamp of when the user voted. |
| `lastmod` | integer | Unix timestamp of last modification. |
| `vote` | integer\|null | 10–100. |
| `started` | string\|null | `"YYYY-MM-DD"`. |
| `finished` | string\|null | |
| `notes` | string\|null | |
| `labels` | array of objects | User labels on this VN. Private labels only shown when authenticated. |
| `labels.id` | integer | |
| `labels.label` | string | |
| `vn.*` | | Any [VN field](#7-post-vn). |
| `releases` | array of objects | Releases of this VN that the user has added to their list. |
| `releases.list_status` | integer | `0` Unknown, `1` Pending, `2` Obtained, `3` On loan, `4` Deleted. |
| `releases.*` | | Any [release field](#8-post-release). |

### 15.2 GET /ulist_labels

Fetch list labels for a user.

**Query parameters:**

| Param | Description |
|---|---|
| `user` | User ID to fetch labels for. Defaults to the authenticated user if omitted. |
| `fields` | Currently only `count` may be specified extra — other fields are always included. |

**Response:** `{"labels": [...]}` where each label object has:

| Field | Type | Description |
|---|---|---|
| `id` | integer | Label ID. |
| `private` | boolean | Private labels only included when authenticated with `listread`. The "Voted" label (`id=7`) is always included even if private. |
| `label` | string | |
| `count` | integer | The "Voted" label's count may differ depending on auth state. |

> Labels with `id < 10` are pre-defined and shared by everyone (still excluded if individually marked private).

```bash
curl 'https://api.vndb.org/kana/ulist_labels?user=u1'
```

### 15.3 PATCH /ulist/\<id\>

Add or update a VN in the user's list. **Requires `listwrite` permission.**

**JSON body members (all optional; omitted = unchanged; `null` unsets, except `labels`):**

| Field | Type | Description |
|---|---|---|
| `vote` | integer | 10–100. |
| `notes` | string | |
| `started` | date | |
| `finished` | date | |
| `labels` | array of integers | **Overwrites** all existing labels with this set. |
| `labels_set` | array of integers | Adds these labels without touching existing ones. |
| `labels_unset` | array of integers | Removes these labels. |

- Virtual labels `0` ("No label") and `7` ("Voted") **cannot** be set manually — "Voted" is auto-managed via the `vote` field.
- ⚠️ **Bug/quirk:** the API does not validate label IDs — non-existent label IDs can be silently stored (invisible on the site / not returned by `POST /ulist`, but may resurface if that ID is later created). Don't rely on this.
- ⚠️ **Quirk:** unlike the website (which auto-clears mutually exclusive Playing/Finished/Stalled/Dropped labels), the API lets you set all of them simultaneously — this is intentional, not a bug.

**Example — unset "Playing", set "Finished", vote 6:**

```bash
curl -XPATCH https://api.vndb.org/kana/ulist/v17 \
    --header 'Authorization: token hsoo-ybws4-j8yb9-qxkw-5obay-px8to-bfyk' \
    --header 'Content-Type: application/json' \
    --data '{"labels_unset":[1],"labels_set":[2],"vote":60}'
```

**Example — remove a vote only:**

```bash
curl -XPATCH https://api.vndb.org/kana/ulist/v17 \
    --header 'Authorization: token hsoo-ybws4-j8yb9-qxkw-5obay-px8to-bfyk' \
    --header 'Content-Type: application/json' \
    --data '{"vote":null}'
```

> ⚠️ This endpoint **always adds the VN to the user's list** if not already present — even for the "remove vote" example above. Use [DELETE /ulist/\<id\>](#155-delete-ulistid) to actually remove a VN from a list.

### 15.4 PATCH /rlist/\<id\>

Add or update a release in the user's list. **Requires `listwrite` permission.** All VNs linked to the release are auto-added to the user's VN list if not already present.

| Field | Type | Description |
|---|---|---|
| `status` | integer | Same values as `releases.list_status` in [§15.1](#151-post-ulist). Defaults to `0`. |

**Example — mark `r12` as obtained:**

```bash
curl -XPATCH https://api.vndb.org/kana/rlist/r12 \
    --header 'Authorization: token hsoo-ybws4-j8yb9-qxkw-5obay-px8to-bfyk' \
    --header 'Content-Type: application/json' \
    --data '{"status":2}'
```

### 15.5 DELETE /ulist/\<id\>

Remove a VN from the user's list. Returns success even if not present. Also removes any associated releases from the list.

```bash
curl -XDELETE https://api.vndb.org/kana/ulist/v17 \
    --header 'Authorization: token hsoo-ybws4-j8yb9-qxkw-5obay-px8to-bfyk'
```

### 15.6 DELETE /rlist/\<id\>

Remove a release from the user's list. Returns success even if not present. Does **not** remove the associated VN from the user's VN list (call [DELETE /ulist/\<id\>](#155-delete-ulistid) separately for that).

```bash
curl -XDELETE https://api.vndb.org/kana/rlist/r12 \
    --header 'Authorization: token hsoo-ybws4-j8yb9-qxkw-5obay-px8to-bfyk'
```

---

## 16. HTTP Response Codes

Successful responses are `200 OK` with a JSON body, or `204 No Content` for DELETE/PATCH. Error bodies are typically `text/plain` or `text/html`.

| Code | Reason |
|---|---|
| 400 | Invalid request body/query — error message should indicate the issue. |
| 401 | Invalid authentication token. |
| 404 | Invalid API path or HTTP method. |
| 429 | Throttled (rate-limited). |
| 500 | Server error — likely a bug if persistent. |
| 502 | Server is down — should be temporary. |

---

## 17. Tips & Troubleshooting

### "Too much data selected"

The server estimates the number of JSON keys your query would produce and rejects overly large responses. The estimate is based purely on `"fields"` and `"results"`. **Fix:** select fewer fields or fewer results.

### List of identifiers

Fetching 100 known IDs in one request is far more efficient than 100 separate calls. Combine them with an `or` filter:

```bash
curl https://api.vndb.org/kana/vn --header 'Content-Type: application/json' --data '{
  "fields": "title",
  "filters": ["or"
     , ["id","=","v1"]
     , ["id","=","v2"]
     , ["id","=","v3"]
     , ["id","=","v4"]
     , ["id","=","v5"] ],
  "results": 100
}'
```

- Don't exceed **100 identifiers** per query.
- Avoid re-sending the same ID list with increasing `"page"` numbers — use the pagination strategy below instead.

### Pagination

`"page"`-based pagination works but is often not the most efficient approach. Since results default-sort by `"id"`, you can paginate by filtering on `id` instead:
- If the last received item was `"v123"`, fetch the next page with `["id",">","v123"]`.
- This trick is less reliable when sorting by other fields — in those cases, `"page"`-based pagination is usually still the better option.

### Random entry

Getting a uniformly random entry efficiently is tricky. Recommended approach:

1. Get the highest existing ID:

```bash
curl https://api.vndb.org/kana/vn --header 'Content-Type: application/json' --data '{
    "sort": "id",
    "reverse": true,
    "results": 1
}'
```

2. Pick a random number between `1` and that max ID (inclusive) — say `v4567` — then fetch the entry with that ID **or the nearest higher existing ID**:

```bash
curl https://api.vndb.org/kana/vn --header 'Content-Type: application/json' --data '{
    "filters": [ "id", ">=", "v4567" ],
    "fields": "title",
    "results": 1
}'
```

- Cache the result of step 1.
- You can add extra filters to both queries to narrow the random pool.
- This has a slight bias due to ID gaps, but is generally good enough.

---

## 18. Change Log

**2026-01-10**
- Added `image` filter to `POST /release`.

**2025-06-02**
- Added `sexual` field to `POST /trait`.

**2025-05-02**
- Limited maximum filter predicates per request to **1000**.

**2025-04-05**
- Added `gender` field to `POST /character`.

**2025-01-11**
- Added `gender` and `gender_spoil` filters to `POST /character`.

**2025-01-09**
- Added `extlink` filter and `extlinks` field to `POST /producer`.

**2025-01-07**
- Added `POST /quote`.

**2024-09-09**
- Added `images` field to `POST /release`.

**2024-07-06**
- Added `"n"` (sexless) as a possible value for the `sex` field of `POST /character`.

**2024-06-05**
- Added `average` field to `POST /vn`.

**2024-05-23**
- Added `extlinks` field to `POST /vn`.

**2024-05-18**
- Added `va` field to `POST /vn`.

**2024-05-11**
- Added `image{thumbnail,thumbnail_dims}` fields to `POST /vn`. (Note: VN images can now exceed 256×400px.)

**2024-03-13**
- Added `POST /staff`.
- Added `editions` and `staff` fields to `POST /vn`.
- Added `enums.staff_role` and `extlinks./staff` to `GET /schema`.

**2023-11-20**
- Added `relations` field to `POST /vn`.

**2023-08-02**
- Added `developers` field to `POST /vn`.

**2023-07-11**
- Deprecated `popularity` sort option for `POST /ulist` and `POST /vn` (now equivalent to reverse-sorting on `votecount`).
- Deprecated `popularity` filter and field for `POST /vn`.

**2023-04-05**
- Added `searchrank` sort option to all endpoints with a `search` filter.

**2023-03-19**
- Added `voiced`, `gtin`, and `catalog` fields to `POST /release`.

**2023-01-17**
- Added `listwrite` permission to API tokens.
- Added `PATCH /ulist/<id>`.
- Added `PATCH /rlist/<id>`.
- Added `DELETE /ulist/<id>`.
- Added `DELETE /rlist/<id>`.

---

## 19. Appendix A — Live Schema: Enumerations

> Snapshot pulled live from `GET /schema` → `enums`. This data changes infrequently but should be re-fetched periodically for full accuracy (especially `platform`, which gets new entries as new hardware appears).

### 19.1 `language`

| id | label |
|---|---|
| `ar` | Arabic |
| `eu` | Basque |
| `be` | Belarusian |
| `bg` | Bulgarian |
| `bs` | Bosnian |
| `ca` | Catalan |
| `ck` | Cherokee |
| `zh` | Chinese |
| `zh-Hans` | Chinese (simplified) |
| `zh-Hant` | Chinese (traditional) |
| `hr` | Croatian |
| `cs` | Czech |
| `da` | Danish |
| `nl` | Dutch |
| `en` | English |
| `eo` | Esperanto |
| `et` | Estonian |
| `fi` | Finnish |
| `fr` | French |
| `gl` | Galician |
| `de` | German |
| `el` | Greek |
| `he` | Hebrew |
| `hi` | Hindi |
| `hu` | Hungarian |
| `ga` | Irish |
| `id` | Indonesian |
| `it` | Italian |
| `iu` | Inuktitut |
| `ja` | Japanese |
| `kk` | Kazakh |
| `ko` | Korean |
| `la` | Latin |
| `lv` | Latvian |
| `lt` | Lithuanian |
| `mk` | Macedonian |
| `ms` | Malay |
| `ne` | Nepali |
| `no` | Norwegian |
| `fa` | Persian |
| `pl` | Polish |
| `pt-br` | Portuguese (Brazil) |
| `pt-pt` | Portuguese (Portugal) |
| `ro` | Romanian |
| `ru` | Russian |
| `gd` | Scottish Gaelic |
| `sr` | Serbian |
| `sk` | Slovak |
| `sl` | Slovene |
| `es` | Spanish |
| `sv` | Swedish |
| `ta` | Tagalog |
| `th` | Thai |
| `tr` | Turkish |
| `uk` | Ukrainian |
| `ur` | Urdu |
| `vi` | Vietnamese |

### 19.2 `medium`

| id | label | plural |
|---|---|---|
| `blr` | Blu-ray disc | Blu-ray discs |
| `mrt` | Cartridge | Cartridges |
| `cas` | Cassette tape | Cassette tapes |
| `cd` | CD | CDs |
| `dc` | Download card | — |
| `dvd` | DVD | DVDs |
| `flp` | Floppy | Floppies |
| `gdr` | GD-ROM | GD-ROMs |
| `in` | Internet download | — |
| `mem` | Memory card | Memory cards |
| `nod` | Nintendo Optical Disc | Nintendo Optical Discs |
| `umd` | UMD | UMDs |
| `otc` | Other | — |

### 19.3 `platform`

| id | label |
|---|---|
| `win` | Windows |
| `lin` | Linux |
| `mac` | Mac OS |
| `web` | Website |
| `tdo` | 3DO |
| `ios` | Apple iProduct |
| `and` | Android |
| `bdp` | Blu-ray Player |
| `dos` | DOS |
| `dvd` | DVD Player |
| `drc` | Dreamcast |
| `nes` | Famicom |
| `sfc` | Super Famicom |
| `fm7` | FM-7 |
| `fm8` | FM-8 |
| `fmt` | FM Towns |
| `gba` | Game Boy Advance |
| `gbc` | Game Boy Color |
| `msx` | MSX |
| `nds` | Nintendo DS |
| `swi` | Nintendo Switch |
| `sw2` | Nintendo Switch 2 |
| `wii` | Nintendo Wii |
| `wiu` | Nintendo Wii U |
| `n3d` | Nintendo 3DS |
| `p88` | PC-88 |
| `p98` | PC-98 |
| `pce` | PC Engine |
| `pcf` | PC-FX |
| `psp` | PlayStation Portable |
| `ps1` | PlayStation 1 |
| `ps2` | PlayStation 2 |
| `ps3` | PlayStation 3 |
| `ps4` | PlayStation 4 |
| `ps5` | PlayStation 5 |
| `psv` | PlayStation Vita |
| `smd` | Sega Mega Drive |
| `scd` | Sega Mega-CD |
| `sat` | Sega Saturn |
| `vnd` | VNDS |
| `x1s` | Sharp X1 |
| `x68` | Sharp X68000 |
| `xb1` | Xbox |
| `xb3` | Xbox 360 |
| `xbo` | Xbox One |
| `xxs` | Xbox X/S |
| `mob` | Other (mobile) |
| `oth` | Other |

### 19.4 `staff_role`

| id | label |
|---|---|
| `scenario` | Scenario |
| `director` | Director |
| `chardesign` | Character design |
| `art` | Artist |
| `music` | Composer |
| `songs` | Vocals |
| `translator` | Translator |
| `editor` | Editor |
| `qa` | Quality assurance |
| `staff` | Staff |

---

## 20. Appendix B — Live Schema: Supported External Links

> Snapshot pulled live from `GET /schema` → `extlinks`. Remember: `url_format` is **informational only** — never construct URLs from it; always use the API-returned `extlinks.url` field, or pass values through the `extlink` filter described in [§8.1](#81-filters).

### 20.1 `/producer` external links

| name | label | url_format |
|---|---|---|
| `pixiv` | Pixiv | `https://www.pixiv.net/member.php?id=%d` |
| `patreon` | Patreon | `https://www.patreon.com/%s` |
| `twitter` | Xitter | `https://x.com/%s` |
| `mobygames_comp` | MobyGames | `https://www.mobygames.com/company/%d` |
| `gamefaqs_comp` | GameFAQs | `https://gamefaqs.gamespot.com/company/%d-` |
| `bilibili` | Bilibili | `https://space.bilibili.com/%d` |
| `fanbox` | Fanbox | `https://%s.fanbox.cc/` |
| `cien` | Ci-en | `https://ci-en.dlsite.com/creator/%d` |
| `booth_pub` | BOOTH | `https://%s.booth.pm/` |
| `tumblr` | Tumblr | `https://%s.tumblr.com/` |
| `boosty` | Boosty | `https://boosty.to/%s` |
| `substar` | SubscribeStar | `https://subscribestar.%s` |
| `youtube` | Youtube | `https://www.youtube.com/@%s` |
| `itch_dev` | Itch.io | `https://%s.itch.io/` |
| `vk` | VK | `https://vk.com/%s` |
| `steam_curator` | Steam Curator | `https://store.steampowered.com/curator/%d` |
| `weibo` | Weibo | `https://weibo.com/u/%d` |
| `wikidata` | Wikidata | `https://www.wikidata.org/wiki/Q%d` |
| `nijie` | Nijie | `https://nijie.info/members.php?id=%d` |
| `facebook` | Facebook | `https://www.facebook.com/%s` |
| `scloud` | SoundCloud | `https://soundcloud.com/%s` |
| `fantia` | Fantia | `https://fantia.jp/fanclubs/%d` |
| `mobygames` | MobyGames | `https://www.mobygames.com/person/%d` |
| `afdian` | Afdian | `https://afdian.com/a/%s` |
| `bsky` | Bluesky | `https://bsky.app/profile/%s` |
| `instagram` | Instagram | `https://www.instagram.com/%s/` |

### 20.2 `/release` external links

| name | label | url_format |
|---|---|---|
| `mg` | MangaGamer | `https://www.mangagamer.com/r18/detail.php?product_code=%d` |
| `playstation_hk` | PlayStation Store (HK) | `https://store.playstation.com/en-hk/product/%s` |
| `melonjp` | Melonbooks.co.jp | `https://www.melonbooks.co.jp/detail/detail.php?product_id=%d` |
| `gyutto` | Gyutto | `https://gyutto.com/i/item%d` |
| `patreon` | Patreon | `https://www.patreon.com/%s` |
| `gamejolt` | Game Jolt | `https://gamejolt.com/games/vn/%d` |
| `appstore` | App Store | `https://apps.apple.com/app/id%d` |
| `kagura` | Kagura Games | `https://www.kaguragames.com/product/%s/` |
| `gog` | GOG | `https://www.gog.com/en/game/%s` |
| `egs` | ErogameScape | `https://erogamescape.dyndns.org/~ap2/ero/toukei_kaiseki/game.php?game=%d` |
| `nintendo_jp` | Nintendo (JP) | `https://store-jp.nintendo.com/item/software/D%d` |
| `playstation_jp` | PlayStation Store (JP) | `https://store.playstation.com/ja-jp/product/%s` |
| `dmm` | DMM | `https://%s` |
| `melon` | Melonbooks.com | `https://www.melonbooks.com/index.php?main_page=product_info&products_id=IT%010d` |
| `nintendo_hk` | Nintendo (HK) | `https://store.nintendo.com.hk/%d` |
| `johren` | Johren | `https://www.johren.games/games/download/%s/` |
| `substar` | SubscribeStar | `https://subscribestar.%s` |
| `freem` | Freem! | `https://www.freem.ne.jp/win/game/%d` |
| `patreonp` | Patreon post | `https://www.patreon.com/posts/%d` |
| `playstation_na` | PlayStation Store (NA) | `https://store.playstation.com/en-us/product/%s` |
| `freegame` | Freegame Mugen | `https://freegame-mugen.jp/%s.html` |
| `googplay` | Google Play | `https://play.google.com/store/apps/details?id=%s` |
| `digiket` | Digiket | `https://www.digiket.com/work/show/_data/ID=ITM%07d/` |
| `booth` | BOOTH | `https://booth.pm/en/items/%d` |
| `steam` | Steam | `https://store.steampowered.com/app/%d/` |
| `itch` | Itch.io | `https://%s.itch.io/%s` |
| `novelgam` | NovelGame | `https://novelgame.jp/games/show/%d` |
| `animateg` | Animate Games | `https://www.animategames.jp/home/detail/%d` |
| `getchu` | Getchu | `http://www.getchu.com/soft.phtml?id=%d` |
| `denpa` | Denpasoft | `https://denpasoft.com/product/%s/` |
| `playstation_eu` | PlayStation Store (EU) | `https://store.playstation.com/en-gb/product/%s` |
| `jastusa` | JAST USA | `https://jastusa.com/games/%s/%s` |
| `fakku` | Fakku | `https://www.fakku.net/games/%s` |
| `dlsite` | DLsite | `https://www.dlsite.com/%s/work/=/product_id/%s.html` |
| `playasia` | PlayAsia | `https://www.play-asia.com/13/70%s` |
| `nintendo` | Nintendo | `https://www.nintendo.com/store/products/%s/` |
| `nutaku` | Nutaku | `https://www.nutaku.net/games/%s/` |
| `getchudl` | DL.Getchu | `http://dl.getchu.com/i/item%d` |
| `toranoana` | Toranoana | `https://ec.toranoana.shop/tora/ec/item/%012d/` |
| `jlist` | J-List | `https://jlist.com/shop/product/%s` |

### 20.3 `/staff` external links

| name | label | url_format |
|---|---|---|
| `pixiv` | Pixiv | `https://www.pixiv.net/member.php?id=%d` |
| `patreon` | Patreon | `https://www.patreon.com/%s` |
| `twitter` | Xitter | `https://x.com/%s` |
| `discogs` | Discogs | `https://www.discogs.com/artist/%d` |
| `mobygames_comp` | MobyGames | `https://www.mobygames.com/company/%d` |
| `vgmdb_org` | VGMdb org | `https://vgmdb.net/org/%d` |
| `bilibili` | Bilibili | `https://space.bilibili.com/%d` |
| `fanbox` | Fanbox | `https://%s.fanbox.cc/` |
| `bgmtv` | Bangumi | `https://bgm.tv/person/%d` |
| `vgmdb` | VGMdb | `https://vgmdb.net/artist/%d` |
| `cien` | Ci-en | `https://ci-en.dlsite.com/creator/%d` |
| `imdb` | IMDb | `https://www.imdb.com/name/nm%07d` |
| `booth_pub` | BOOTH | `https://%s.booth.pm/` |
| `tumblr` | Tumblr | `https://%s.tumblr.com/` |
| `boosty` | Boosty | `https://boosty.to/%s` |
| `anidb` | AniDB | `https://anidb.net/cr%d` |
| `substar` | SubscribeStar | `https://subscribestar.%s` |
| `youtube` | Youtube | `https://www.youtube.com/@%s` |
| `itch_dev` | Itch.io | `https://%s.itch.io/` |
| `vk` | VK | `https://vk.com/%s` |
| `mbrainz` | MusicBrainz | `https://musicbrainz.org/artist/%s` |
| `kofi` | Ko-fi | `https://ko-fi.com/%s` |
| `anison` | Anison | `http://anison.info/data/person/%d.html` |
| `steam_curator` | Steam Curator | `https://store.steampowered.com/curator/%d` |
| `weibo` | Weibo | `https://weibo.com/u/%d` |
| `vndb` | VNDB user | `https://vndb.org/%s` |
| `wikidata` | Wikidata | `https://www.wikidata.org/wiki/Q%d` |
| `deviantar` | DeviantArt | `https://www.deviantart.com/%s` |
| `nijie` | Nijie | `https://nijie.info/members.php?id=%d` |
| `facebook` | Facebook | `https://www.facebook.com/%s` |
| `scloud` | SoundCloud | `https://soundcloud.com/%s` |
| `fantia` | Fantia | `https://fantia.jp/fanclubs/%d` |
| `egs_creator` | ErogameScape | `https://erogamescape.dyndns.org/~ap2/ero/toukei_kaiseki/creater.php?creater=%d` |
| `mobygames` | MobyGames | `https://www.mobygames.com/person/%d` |
| `afdian` | Afdian | `https://afdian.com/a/%s` |
| `bsky` | Bluesky | `https://bsky.app/profile/%s` |
| `instagram` | Instagram | `https://www.instagram.com/%s/` |

### 20.4 `/vn` external links

| name | label | url_format |
|---|---|---|
| `renai` | Renai.us | `https://renai.us/game/%s` |
| `wikidata` | Wikidata | `https://www.wikidata.org/wiki/Q%d` |

---

## 21. Appendix C — Live Schema: API Field Map

> This is the raw `api_fields` map from `GET /schema`, showing exactly which field names are queryable per endpoint, and which sub-objects inherit their field set from another endpoint (via `"_inherit"`). A value of `null` simply marks "this is a leaf/selectable field" — it carries no other meaning. Use this as a quick cross-check against the detailed field tables in sections 7–14 above; it reflects the *current live* state of the API and should be treated as authoritative if it ever disagrees with the prose documentation.

```json
{
  "/character": {
    "age": null, "aliases": null, "birthday": null, "blood_type": null,
    "bust": null, "cup": null, "description": null, "gender": null,
    "height": null, "hips": null, "id": null,
    "image": { "dims": null, "id": null, "sexual": null, "url": null, "violence": null, "votecount": null },
    "name": null, "original": null, "sex": null,
    "traits": { "_inherit": "/trait", "lie": null, "spoiler": null },
    "vns": { "_inherit": "/vn", "release": { "_inherit": "/release" }, "role": null, "spoiler": null },
    "waist": null, "weight": null
  },
  "/producer": {
    "aliases": null, "description": null,
    "extlinks": { "id": null, "label": null, "name": null, "url": null },
    "id": null, "lang": null, "name": null, "original": null, "type": null
  },
  "/quote": {
    "character": { "_inherit": "/character" },
    "id": null, "quote": null, "score": null,
    "vn": { "_inherit": "/vn" }
  },
  "/release": {
    "alttitle": null, "catalog": null, "engine": null,
    "extlinks": { "id": null, "label": null, "name": null, "url": null },
    "freeware": null, "gtin": null, "has_ero": null, "id": null,
    "images": {
      "dims": null, "id": null, "languages": null, "photo": null,
      "sexual": null, "thumbnail": null, "thumbnail_dims": null,
      "type": null, "url": null, "violence": null, "vn": null, "votecount": null
    },
    "languages": { "lang": null, "latin": null, "main": null, "mtl": null, "title": null },
    "media": { "medium": null, "qty": null },
    "minage": null, "notes": null, "official": null, "patch": null, "platforms": null,
    "producers": { "_inherit": "/producer", "developer": null, "publisher": null },
    "released": null, "resolution": null, "title": null, "uncensored": null,
    "vns": { "_inherit": "/vn", "rtype": null },
    "voiced": null
  },
  "/staff": {
    "aid": null,
    "aliases": { "aid": null, "ismain": null, "latin": null, "name": null },
    "description": null,
    "extlinks": { "id": null, "label": null, "name": null, "url": null },
    "gender": null, "id": null, "ismain": null, "lang": null, "name": null, "original": null
  },
  "/tag": {
    "aliases": null, "applicable": null, "category": null, "description": null,
    "id": null, "name": null, "searchable": null, "vn_count": null
  },
  "/trait": {
    "aliases": null, "applicable": null, "char_count": null, "description": null,
    "group_id": null, "group_name": null, "id": null, "name": null,
    "searchable": null, "sexual": null
  },
  "/ulist": {
    "added": null, "finished": null, "id": null,
    "labels": { "id": null, "label": null },
    "lastmod": null, "notes": null,
    "releases": { "_inherit": "/release", "list_status": null },
    "started": null,
    "vn": { "_inherit": "/vn" },
    "vote": null, "voted": null
  },
  "/vn": {
    "aliases": null, "alttitle": null, "average": null, "description": null,
    "developers": { "_inherit": "/producer" },
    "devstatus": null,
    "editions": { "eid": null, "lang": null, "name": null, "official": null },
    "extlinks": { "id": null, "label": null, "name": null, "url": null },
    "id": null,
    "image": {
      "dims": null, "id": null, "sexual": null, "thumbnail": null,
      "thumbnail_dims": null, "url": null, "violence": null, "votecount": null
    },
    "languages": null, "length": null, "length_minutes": null, "length_votes": null,
    "olang": null, "platforms": null, "popularity": null, "rating": null,
    "relations": { "_inherit": "/vn", "relation": null, "relation_official": null },
    "released": null,
    "screenshots": {
      "dims": null, "id": null,
      "release": { "_inherit": "/release" },
      "sexual": null, "thumbnail": null, "thumbnail_dims": null,
      "url": null, "violence": null, "votecount": null
    },
    "staff": { "_inherit": "/staff", "eid": null, "note": null, "role": null },
    "tags": { "_inherit": "/tag", "lie": null, "rating": null, "spoiler": null },
    "title": null,
    "titles": { "lang": null, "latin": null, "main": null, "official": null, "title": null },
    "va": {
      "character": { "_inherit": "/character" },
      "note": null,
      "staff": { "_inherit": "/staff" }
    },
    "votecount": null
  }
}
```

> ⚠️ Note: the live schema still lists a `popularity` field/sort option under `/vn` even though the prose documentation ([§18, 2023-07-11](#18-change-log)) marks it as **deprecated**. Prefer sorting/filtering on `votecount` instead, as documented.

---

## Quick Reference — Common Recipes for an AI Agent

```bash
# 1. Look up a VN by exact title search, get title + rating + description
curl https://api.vndb.org/kana/vn --header 'Content-Type: application/json' --data '{
  "filters": ["search", "=", "Steins;Gate"],
  "fields": "title, alttitle, rating, votecount, description, image.url",
  "results": 5
}'

# 2. Get all releases (with language/platform) for a given VN
curl https://api.vndb.org/kana/release --header 'Content-Type: application/json' --data '{
  "filters": ["vn", "=", ["id", "=", "v17"]],
  "fields": "title, released, languages.lang, platforms, minage"
}'

# 3. Get a character's appearance + trait list
curl https://api.vndb.org/kana/character --header 'Content-Type: application/json' --data '{
  "filters": ["id", "=", "c1"],
  "fields": "name, original, image.url, traits{name,group_name,spoiler}"
}'

# 4. Search VNs by tag with minimum tag rating, sorted by rating desc
curl https://api.vndb.org/kana/vn --header 'Content-Type: application/json' --data '{
  "filters": ["tag", "=", ["g505", 2, 1.0]],
  "fields": "title, rating, votecount",
  "sort": "rating",
  "reverse": true,
  "results": 20
}'

# 5. Get a specific user'\''s VN list with vote and labels
curl https://api.vndb.org/kana/ulist --header 'Content-Type: application/json' --data '{
  "user": "u2",
  "fields": "vote, added, labels{id,label}, vn.title",
  "sort": "vote",
  "reverse": true,
  "results": 50
}'
```

---

*Document compiled for AI agent reference use. Source: `https://api.vndb.org/kana` (official VNDB API v2 docs) and `https://api.vndb.org/kana/schema` (live schema). Always re-verify against the live endpoints for production-critical integrations, since enums (especially `platform`) and the change log are updated periodically by VNDB.*

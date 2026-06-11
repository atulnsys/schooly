# School Digital Operating System (SDOS) — Drive Manifest Schema Specification

To bridge localized target file storage systems with cloud integrations (such as Google Workspace and Schooly AI panels), the full drive structure compiles into a master index: `schooly-drive-manifest.json`. 

This JSON file registers all metadata schemas, systems keys, stage divisions, section allocations, and service accounts.

---

## 1. Core Schema Fields Specification

| JSON KeyName | Type | Description / Constraints |
| :--- | :---: | :--- |
| `schemaId` | `string` | Unique schema identifier (`schooly-sdos-manifest`). |
| `schemaVersion` | `string` | Major/minor system version of the manifest format (`2.0.0`). |
| `schoolName` | `string` | Registered institution name (e.g. `Greenwood K-12 Academy`). |
| `schoolCode` | `string` | Unique institutional identification parameter (e.g. `GW-K12-998`). |
| `curriculum` | `string` | Active syllabus mapping strategy (`CBSE`, `Generic-K12`, `ICSE`). |
| `rootPath` | `string` | Absolute physical path where folders were established (e.g. `C:\SchoolyTestDrive`). |
| `academicYear` | `string` | Target academic session (e.g. `AY 2026-27`). |
| `configSource` | `string` | Filepath or source code where metadata configurations were pulled. |
| `createdTimestamp` | `string` | High-precision ISO-8601 formatting showing compilation timestamp. |
| `academicRepositoryRoot`| `string` | Directory name representing the curriculum knowledge base. |
| `governanceRoot` | `string` | Directory name hosting administrative ledgers and strategic policies. |
| `classroomTemplatesRoot`| `string` | Directory name of instructional topics conventions and boilerplate files. |
| `formsIntakeRoot` | `string` | Directory where automated scraper intake folders are structured. |
| `orgStructureRoot` | `string` | Directory for non-teaching staff, teaching staff, and LDAP directories. |
| `institutionalIdentities`| `object` | Maps key organizational managers to target owner accounts: `academicRepository`, `governance`, `classroomAdmin`. |
| `serviceAccounts` | `array` | System user IDs authorized to access operational pipelines. |
| `departmentGroups` | `array` | Domain email groups aggregating department headers and coordinators. |
| `teacherGroups` | `array` | Email groups representing teacher subsets (e.g. `allteachers@school.org`). |
| `standardClassroomTopics`| `array` | Standard courses topics schemas and emojis displayed in LMS layers. |
| `repositoryStages` | `array` | Structured lists showing academic levels (e.g. `Pre-Primary`, `Primary`). |
| `repositoryClasses` | `object` | Key-value dictionary correlating Stage levels to Class arrays. |
| `repositorySections` | `array` | Section name allocations list (e.g. `A, B, C, D` or `Gold, Silver`). |
| `repositorySubjects` | `object` | Key-value dictionary listing available subjects for each Stage level. |
| `subjectArtifactFolders` | `array` | Mandatory structural subfolders created within every subject partition. |
| `governanceFolders` | `array` | Active subfolders constructed under the main corporate executive workspace. |
| `formsIntakeCategories` | `array` | Operational scraper targets matching intake file drops. |
| `dashboardModules` | `array` | List of metrics modules integrated into administrative surveillance screens. |
| `pathSafetyMode` | `string` | Validation constraint confirming invalid character replacement (`Windows-Safe-Normalized`). |

---

## 2. Directory Path Safety Normalization

The PowerShell generator programmatically ensures safe directory path name creation regardless of inputs specified in custom JSON configurations. This is handled via the `ConvertTo-SafePathName` algorithm:
1. Strips invalid reserved characters `< > : " / \ | ? *` completely.
2. Removes terminating trailing periods or space variations that degrade Windows safe address limits.
3. Preserves legitimate spaces (rather than changing them to hyphens or underscores) to ensure readable, humbler, and human-friendly file layouts.

---

## 3. Web-Based Explorer Validation Checkpoints (16 Indicators)

Administrative coordinators can drag-and-drop or import any physical `schooly-drive-manifest.json` file inside the **School Digital Drive & Manifest Indexer** located inside the **System Governance** workspace pane. 

To prevent corruption, the applet validates the import against **16 discrete metadata checkpoints**:

```typescript
const mandatedKeys = [
  "rootPath", "academicYear", "academicRepositoryRoot", "governanceRoot",
  "classroomTemplatesRoot", "formsIntakeRoot", "orgStructureRoot",
  "serviceAccounts", "departmentGroups", "teacherGroups",
  "standardClassroomTopics", "repositoryStages", "repositoryClasses",
  "repositorySections", "repositorySubjects", "subjectArtifactFolders"
];
```

The system audits:
- **Presence Validation**: Checks that all 16 keys exist in the file.
- **Type Correctness**: Ensures array structures are arrays, and Stage mappings match valid dictionary schemas.
- **Syntax Check**: Reports immediate parsing faults and logs detailed diagnostic outputs securely on-screen before reloading states.

---
*Maintained by the Schooly AI Enterprise Systems Committee — 2026.*

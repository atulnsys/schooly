# Google Classroom publishing

Schooly can publish existing Google Drive artifacts from the Lesson Planner to
Google Classroom. The integration is browser-only and does not add a database,
worker, queue, or separate deployment service.

## Google Cloud setup

1. Enable the Google Classroom API and Google Drive API in the Google Cloud
   project used by Schooly.
2. Configure the OAuth consent screen.
3. Create an OAuth 2.0 Client ID with application type **Web application**.
4. Add every deployed Schooly URL under **Authorized JavaScript origins**.
   For local development, add `http://localhost:3000`.
5. Put the browser client ID in:

   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_GOOGLE_CLASSROOM_ENABLED=true
   ```

No client secret is used or required by the static app.

## OAuth scopes

Scopes are centralized in `src/lib/googleClassroom.ts`:

- `classroom.courses.readonly`
- `classroom.topics`
- `classroom.coursework.students`
- `classroom.courseworkmaterials`
- `classroom.announcements`

The OAuth access token is kept in memory only. Reloading the page, token expiry,
or revoked access requires the user to reconnect.

## Publishing workflow

1. Generate or open a chapter pack in **Lesson Plans**.
2. Ensure the app has an existing real Google Drive `webViewLink` for the
   artifact. Schooly's existing Drive-link flow is reused.
3. Open **Publish to Classroom**.
4. Connect a Google account that is a teacher in the target course.
5. Select a course and select or create the chapter topic.
6. Review the artifact mapping, select artifacts, and publish.

Question Bank, Assessment Bank, Raw Markdown, and SQAA Links are not selected by
default. Publishing any of them requires explicit user selection.

Returned Classroom IDs, course/topic IDs, Drive IDs, publisher, timestamp,
status, and CBSE/NCERT/NEP/SQAA tags are stored using the app's existing
browser-local persistence pattern. Existing post IDs prevent silent duplicate
publishing. Users may explicitly choose **Republish as new copy**.

Rubric files are attached to a Classroom assignment as Drive material. Creating
a native Classroom rubric requires structured criterion and level data, which
the current Schooly artifact model does not provide.

## Drive sharing

Google Classroom must be able to share or access the referenced Drive file.
The connected teacher should own the file or have sufficient sharing rights.
Schooly does not duplicate or regenerate the Drive file for Classroom.

## Frontend-only limitations

- OAuth requires an `http` or `https` authorized origin. Google OAuth does not
  run from a `file://` origin.
- `dist/index-inline.html` remains useful for static viewing and sharing, but
  Classroom connection must be opened from an authorized hosted origin.
- Tokens are intentionally session-only and are not restored after reload.
- Native Classroom rubric creation is not attempted without structured rubric
  criteria.

## Build and test

Run:

```text
npm run lint
npm run build
```

The build keeps `dist/index.html` and automatically generates
`dist/index-inline.html` with the compiled CSS and JavaScript embedded.

Test with a teacher account and a non-production Classroom course. Verify course
loading, topic reuse/creation, each selected post type, duplicate prevention,
reconnect handling, and the returned **Open in Classroom** link.

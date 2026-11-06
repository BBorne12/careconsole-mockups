# CareConsole mockups

Clickable, self-contained HTML mockups of a Home Telehealth care-coordination workflow.
All patients and data are **synthetic**; nothing connects to a real system.

| Page | What it shows |
|---|---|
| `va-desktop.html` | A simulated VA Windows workstation. A browser window runs the CareConsole pages; a CPRS window (open it from the taskbar) lets you create a progress note, paste text into it (80-column wrap), save it unsigned, or sign it. |
| `worklist.html` | CareConsole Work List for nine sample patients, with expandable history (7/14/30 days), assess/acknowledge, filters, header menus, and the **Copy To CPRS** dialog that builds the CPRS report text. |
| `patient-analysis.html` | Patient Analysis page (MONITOR > Patient Analysis Page): risk levels, trend, monthly summary, 6-month charts, events, DMP responses, and a BLUF + SBAR note (**Compile note**) that can be copied as 80-column plain text for CPRS. |

"Today" is simulated as **June 29, 2026**, the date of the latest sample readings (Jan 1 - Jun 29, 2026).

## Running

Open `index.html` (or `va-desktop.html`) in a browser. Each page is a single file with its data, images and font built in.
The VA desktop loads the other two pages in its browser window, so keep the three files in the same folder.
Notes, assessments and settings are kept in the browser's local storage.

## Sample patients

| Program | Improving | No change | Worsening |
|---|---|---|---|
| Hypertension | Kyle Bennett | Robert Hale | David Moreno |
| Heart Failure | Brad Foster | Phil Dawson | Miles Carter |
| MOVE! Weight Management | Sarah Collins | Bob Turner | Michelle Reyes |

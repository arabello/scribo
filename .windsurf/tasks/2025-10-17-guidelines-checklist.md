# Task: Guidelines and Checklist

The goal for this task is to iterate over the feature of guidelines and checklist from the user experience perspective.

We want both the guidelines and checklist to be full page on the right side (3rd column) of the page.
For this matter refactor the current layout and add a top tabs (shadcn component) bar to switch between guidelines and checklist.

The user should be able to edit, add or remove guidelines or checklist items. Provide a guided way to do so instead of letting
the user writing plain text. Make sure that everything is storage in the local storage so the user doens't lose anythin if it reloades the page or come back for a new session. Note that if the text is too long, the user is able to see it on edit but it should be ellipsed when not in an editing state. Use optimistic UI meaning that the user doens't need to confirm for editing, adding or removing, but provide a non invasive way to revert the changes.

The next step is to alter the current behavior of the analyze
function: we should completely remove the floatin bar and put the feature as a button in the guidelines and checklist section separately. In this way the user should run the analysis independently for the guidelines and checklist in separated moments.

Ultimately provide an import/export functionality to import/export the current state of the guidelines or checklist using the format used to store them in the local storage.

If anything is not clear, please ask for clarification.

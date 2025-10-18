# Task: Guidelines and Checklist Markdown

The goal of this task is to migrate the current model and editing behavior for the guidelines and checklist to markdown files.

## Desired End State

`item` is used as term to refer to a checklist item or a guideline item.

- The guidelines and checklist section have a `reading` and `editing` mode.
- The applicaiton state should represent guidelines and checklist as a deterministi data model, borth for React and local storage state.
- The user should interact with the guidelines and checklist in `editing` mode writing markdown
  - A guideline title should be represented as a `#` header, while its description as the normal text following the header
  - A checklist item should be represented as a markdown check list `- [ ] content`
- The markdown should be parsed and displayed in `reading` mode. The current UI for reading mode is ok.

Because the user can write anything in the markdown content, make the parsing optministic meaning that everything that is not parsed correctly as a guideline or checklist item should be ignored while in reading mode.

Remember that the goal to use Markdown is to simplify the code overall.

## Verification

- Run `pnpm dev` and navigate to `http://localhost:5173`
- Verify that the guidelines and checklist are displayed correctly
- Verify that the guidelines and checklist can be edited correctly

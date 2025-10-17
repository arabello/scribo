# Task Guidelines

The feature in the first iteration will create a proper list UI in the corresponding section based on the guidelines content provided in the file `guidelines.md` of the project. This is a static asset for the moment.

The section must be scrollable.

When the user click analyze there should be a loading component over the section until the elaboration is complete.

The analsis is done by an LLM completion to the OpenAI provider which will respond with a structured data.

The goal is to, when finished, allow the user to click on a guideline list item and the corresponding text in the text are that DOES NOT comply with the guideline to be highlighted

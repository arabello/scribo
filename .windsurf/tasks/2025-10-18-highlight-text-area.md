# Task: Highlight text are based on failed guidelined

The goal of this task is to provide the user a way to easily see their parts of text that are
not following a specific guideline.

The end result should be that if the user click on a failing guideline that have verbatim text reported,
the content inside the centra text area should be highlighted. Note that a guideline can refer to
different multiple text parts.

The issue is that there is no native way to do so. The intuition is that we can create a div
stacked behind the text area that renders colored boxes for each text part that is failing a guideline
so the color transparancy is visible under the text. An example can be found here https://codepen.io/lonekorean/pen/gaLEMR.

Note that the behind div should be updated in real time as the text is being edited and should scroll
as the text area does. Basically the complete visual sync should be guaranteed.

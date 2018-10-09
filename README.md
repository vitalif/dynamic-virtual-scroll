# Dynamic Virtual Scroll Driver

Virtual scrolling is a technique for displaying long lists when you render only a small number
of visible items and skip items that are offscreen. You may also have heard about it like
"buffered render" or "windowed render" - it's the same.

There are plenty of virtual scroll implementations for JS.
Some of them are part of a larger UI library (ag-grid, ExtJS and so on),
some of them are more standalone (react-virtualized, react-window, ngx-virtual-scroller, react-dynamic-virtual-list).

However, there is a thing that they all miss: dynamic (and unknown apriori) row heights.
Some implementations allow to set different row heights for items, but you must calculate
all heights before rendering; some allow dynamic row heights, but have bugs and do not really work;
others just force you to use fixed row height. Most implementations are also tied to some specific
UI component or framework and are unusable with other ones.

Good news, everyone: we have a solution!

It is render-agnostic and implemented in this library. Basically, this library only does the maths for you
while letting you render your component yourself. You can use it with React, Angular, pure JS or any other framework
you want to. It works smoothly, does not break built-in browser scrolling and even works on mobile devices.

# Usage

The library exports a single function:

```
import { virtualScrollDriver } from 'dynamic-virtual-scroll';

const newState = virtualScrollDriver(
    { totalItems, minRowHeight, viewportHeight, scrollTop },
    oldState,
    function getRenderedItemHeight(itemIndex) { ... }
);
```

You must call it after each render and also when the viewport, scroll position or items change.

Description of parameters:

* `totalItems` - total number of items in your list
* `minRowHeight` - minimum item height
* `viewportHeight` - current viewport height (take from DOM)
* `scrollTop` - current scroll position (take from DOM)
* `oldState` - previous state object as returned from previous `virtualScrollDriver()` call
* `getRenderedItemHeight = (itemIndex) => height`:
  * this function MUST return the height of currently rendered item or 0 if it's not currently rendered
  * the returned height MUST be >= props.minRowHeight
  * the function MAY cache heights of rendered items if you want your list to be more responsive

Returned object is `newState`. It contains the render parameters for you and also some internal state variables.
What to do with it:

* you MUST re-render your list when any state values change
* you MUST preserve all keys in the state object and pass it back via `oldState` on the next run
* you MUST base your rendering on the following keys:
  * `newState.targetHeight` - height of the 1px wide invisible div you should render in the scroll container
  * `newState.topPlaceholderHeight` - height of the first (top) placeholder. omit placeholder if it is 0
  * `newState.firstMiddleItem` - first item to be rendered after top placeholder
  * `newState.middleItemCount` - item count to be renderer after top placeholder. omit items if it is 0
  * `newState.middlePlaceholderHeight` - height of the second (middle) placeholder. omit placeholder if it is 0
  * `newState.lastItemCount` - item count to be rendered in the end of the list

# Usage example with React

See `DynamicVirtualScrollExample.js`.

How to test it:

* Clone this repository
* `npm install`
* `npm run build`
* Open `index.html` in your browser

# Algorithm

* Use reasonable fixed minimum row height
* Always render `screen/minHeight` last rows
* Find maximum possible viewport start in units of (item number + % of item)
* Measure average height of last rows
* `avgHeight = max(minHeight, lastRowAvgHeight)`
* `targetHeight = avgHeight*rowCount + headerHeight`
* Total scroll view height will be `targetHeight`
* `scrollPos = targetHeight > offsetHeight ? min(1, scrollTop / (targetHeight - offsetHeight)) : 0`
* First visible item will be `Math.floor(scrollPos*maxPossibleViewportStart)`
* Additional scroll offset will be `itemOffset = (scrollPos*maxPossibleViewportStart - Math.floor(scrollPos*maxPossibleViewportStart))*firstVisibleItemHeight`
* First (top) placeholder height will be `scrollTop-itemOffset`
* Second (middle) placeholder height will be `avgHeight*nodeCount - sum(heights of all rendered rows) - (first placeholder height)`

# License and author

Author: Vitaliy Filippov, 2018+

License: GNU LGPLv3.0 or newer

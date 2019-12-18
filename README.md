# Dynamic Virtual Scroll Driver

Virtual scrolling is a technique for displaying long lists or tables when you render only a small number
of visible items and skip items that are offscreen. You may also have heard about it like
"buffered render" or "windowed render" - it's the same.

There are plenty of virtual scroll implementations for JS.
Some of them are part of a larger UI library (ag-grid, ExtJS and so on), some of them are more
standalone (react-virtualized, react-window, ngx-virtual-scroller, ngx-ui-scroll, react-dynamic-virtual-list).

However, there is a thing that they all miss: dynamic (and unknown apriori) row heights.
Some implementations allow to set different row heights for items, but you must calculate
all heights before rendering; some allow dynamic row heights, but have bugs and act weird or don't really work;
others just force you to use fixed row height. Most implementations are also tied to some specific
UI component or framework and are unusable with other ones.

Good news, everyone: we have a solution!

It is render-agnostic and implemented in this library. Basically, this library only does the maths for you
while letting you render your component yourself. You can use it with React, Angular, pure JS or any other
framework you want to. You can implement lists and grids (tables) with it. It works smoothly, does not break
built-in browser scrolling and even works on mobile devices.

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
  * WARNING: you SHOULD NOT use `element.offsetHeight` for measuring. Either use `element.getBoundingClientRect().height`
    or use some pre-computed heights, because `offsetHeight` may truncate the height to -1px when
    browser scale is not 100%. Also it gives incorrect results with CSS transforms.

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
* also note that you MUST set `overflow-anchor: none` on your scroll container. You'll end up with
  `virtualScrollDriver()` not able to finish updating in Chrome if you don't.

# Usage with React

There is a reference virtual list implementation for React.

It is usually sufficient for almost everything, including grids. Sad thing about grids (virtualized tables)
in HTML is that automatic table-like layout is slow in browsers, so in fact the best way to implement
them is via simple virtualized lists of \<div>'s with absolutely positioned cells inside.

```
import React from 'react';
import { VirtualScrollList } from 'dynamic-virtual-scroll/VirtualScrollList.es5.js';

class MyList extends React.Component
{
    renderItem = (i) =>
    {
        if (!this.items[i])
            return null;
        return <div style={{minHeight: '20px'}}>{this.items[i].title}</div>;
    }

    render()
    {
        return <VirtualScrollList
            totalItems={this.items.length}
            renderItem={this.renderItem}
            minRowHeight={20}
        />;
    }
}
```

Description of VirtualScrollList parameters:

- totalItems: required, total number of items in the list.
- minRowHeight: required, minimal possible item height in the list.
- renderItem: required, function that renders item by index as React element(s).
- viewportHeight: optional, viewport height to use for virtual scrolling.
  May be used in case when it can't be determined automatically by VirtualScroll,
  for example inside an animated element with css maxHeight.
- header: optional, React element(s) to unconditionally render in the beginning of
  the list. The intended usage is to render fixed header row with CSS position: sticky
  over the scrolled content.
- headerHeight: optional. In case there is a fixed header, this must be its height
  in pixels.
- All other parameters (className, style, onClick, etc) are passed as-is to the
  underlying root \<div> of the list.

VirtualScrollList contains some extra shenanigans to make sure the scroll position
preserves when the total number of items changes. Also it has two extra methods:

- `list.scrollToItem(itemIndex)` - positions the list at `itemIndex`. The index may
  contain fractional part, in that case the list will be positioned at the corresponding
  % of height of the item.
- `list.getItemScrollPos()` - returns current scroll position in items. The returned
  index may contain fractional part and may be used as input to `list.scrollToItem()`.

# Simpler React example

See `DynamicVirtualScrollExample.js`.

How to test it:

* Clone this repository
* `npm install`
* `npm run build`
* Open `index.html` in your browser

# Demo

http://yourcmc.ru/dynamic-virtual-scroll/

# Algorithm

* Use reasonable fixed minimum row height
* Always render `screen/minHeight` last rows
* Find maximum possible viewport start in units of (item number + % of item)
* Measure average height of last rows
* `avgHeight = max(minHeight, lastRowAvgHeight)`
* `targetHeight = avgHeight*rowCount`
* Total scroll view height will be `targetHeight`
* `scrollPos = targetHeight > offsetHeight ? min(1, scrollTop / (targetHeight - offsetHeight)) : 0`
* First visible item will be `Math.floor(scrollPos*maxPossibleViewportStart)`
* Additional scroll offset will be `itemOffset = (scrollPos*maxPossibleViewportStart - Math.floor(scrollPos*maxPossibleViewportStart))*firstVisibleItemHeight`
* First (top) placeholder height will be `scrollTop-itemOffset`
* Second (middle) placeholder height will be `avgHeight*nodeCount - sum(heights of all rendered rows) - (first placeholder height)`

# License and author

Author: Vitaliy Filippov, 2018+

License: GNU LGPLv3.0 or newer

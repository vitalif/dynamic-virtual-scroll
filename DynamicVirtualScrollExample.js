import React from 'react';

import { virtualScrollDriver } from './DynamicVirtualScroll.js';

export class DynamicVirtualScrollExample extends React.PureComponent
{
    constructor()
    {
        super();
        const items = [];
        for (let i = 0; i < 1000; i++)
        {
            items[i] = 30 + Math.round(Math.random()*50);
        }
        this.state = { items };
    }

    getRenderedItemHeight_MemoryExample = (index) =>
    {
        // Just for example: imitating renderer not knowing about off-screen items
        if (index >= this.state.firstMiddleItem && index < this.state.firstMiddleItem+this.state.middleItemCount ||
            index >= this.state.items.length - this.state.lastItemCount)
        {
            return this.state.items[index];
        }
        return 0;
    }

    getRenderedItemHeight_DOMExample = (index) =>
    {
        // DOM example. As smooth as the previous one (memory example), even without caching
        if (this.itemElements[index])
        {
            return this.itemElements[index].offsetHeight;
        }
        return 0;
    }

    getRenderedItemHeight = this.getRenderedItemHeight_DOMExample

    renderItems(start, count)
    {
        return this.state.items.slice(start, start+count).map((item, index) => (<div
            key={'i'+(index+start)}
            ref={e => this.itemElements[index+start] = e}
            style={{height: item+'px', color: 'white', textAlign: 'center', lineHeight: item+'px', background: 'rgb('+Math.round(item*255/80)+',0,0)'}}>
            № {index+start}: {item}px
        </div>));
    }

    render()
    {
        this.itemElements = [];
        return (<div style={{overflowY: 'scroll', height: '400px', width: '400px'}}
            ref={e => this.viewport = e}
            onScroll={this.componentDidUpdate}>
            <div style={{height: this.state.targetHeight+'px'}}>
                {this.state.topPlaceholderHeight
                    ? <div style={{height: this.state.topPlaceholderHeight+'px'}}></div>
                    : null}
                {this.state.middleItemCount
                    ? this.renderItems(this.state.firstMiddleItem, this.state.middleItemCount)
                    : null}
                {this.state.middlePlaceholderHeight
                    ? <div style={{height: this.state.middlePlaceholderHeight+'px'}}></div>
                    : null}
                {this.state.lastItemCount
                    ? this.renderItems(this.state.items.length-this.state.lastItemCount, this.state.lastItemCount)
                    : null}
            </div>
        </div>);
    }

    // We should re-render only when we know we need some items that are not currently rendered
    componentDidUpdate = () =>
    {
        const newState = virtualScrollDriver(
            {
                totalItems: this.state.items.length,
                minRowHeight: 30,
                viewportHeight: this.viewport.clientHeight,
                scrollTop: this.viewport.scrollTop,
            },
            this.state,
            this.getRenderedItemHeight
        );
        this.setStateIfDiffers(newState);
    }

    componentDidMount()
    {
        this.componentDidUpdate();
    }

    setStateIfDiffers(state, cb)
    {
        for (const k in state)
        {
            if (this.state[k] != state[k])
            {
                this.setState(state, cb);
                return true;
            }
        }
        return false;
    }
}
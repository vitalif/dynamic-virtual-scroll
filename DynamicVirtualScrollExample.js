import React from 'react';

import { virtualScrollDriver } from './DynamicVirtualScroll.js';

export class DynamicVirtualScrollExample extends React.PureComponent
{
    useFixedHeader = true

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
            return this.itemElements[index].getBoundingClientRect().height;
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
        return (<div style={{position: 'relative', width: '400px'}}>
            <div style={{overflowY: 'scroll', height: '400px', width: '400px', overflowAnchor: 'none', outline: 'none'}}
                tabIndex="1"
                ref={e => this.viewport = e}
                onScroll={this.driver}>
                <div style={{height: this.state.targetHeight+'px'}}>
                    {this.useFixedHeader
                        ? <div style={{height: '30px'}}></div>
                        : null}
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
            </div>
            {this.useFixedHeader ? <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: this.state.scrollbarWidth+'px',
                height: '30px',
                background: '#0080c0',
                color: 'white',
                textAlign: 'center',
                lineHeight: '30px'}}>
                fixed header
            </div> : null}
        </div>);
    }

    driver = () =>
    {
        const newState = virtualScrollDriver(
            {
                totalItems: this.state.items.length,
                minRowHeight: 30,
                viewportHeight: this.viewport.clientHeight - (this.useFixedHeader ? 30 : 0),
                scrollTop: this.viewport.scrollTop,
            },
            this.state,
            this.getRenderedItemHeight
        );
        newState.scrollbarWidth = this.viewport ? this.viewport.offsetWidth-this.viewport.clientWidth : 12;
        this.setStateIfDiffers(newState);
    }

    componentDidUpdate = () =>
    {
        this.driver();
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

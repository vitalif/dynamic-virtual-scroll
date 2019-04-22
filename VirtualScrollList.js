/**
 * A simple React list with virtual scrolling based on dynamic-virtual-scroll driver
 * USUALLY sufficient for everything including grids (using absolute sizing of cells).
 * Just because browsers can't do virtualized grid or table layouts efficiently.
 */

import React from 'react';
import PropTypes from 'prop-types';

import { virtualScrollDriver } from 'dynamic-virtual-scroll';

export class VirtualScrollList extends React.Component
{
    static propTypes = {
        className: PropTypes.string,
        style: PropTypes.object,
        totalItems: PropTypes.number.isRequired,
        minRowHeight: PropTypes.number.isRequired,
        viewportHeight: PropTypes.number,
        header: PropTypes.any,
        headerHeight: PropTypes.number,
        renderItem: PropTypes.func.isRequired,
    }

    state = {
        targetHeight: 0,
        topPlaceholderHeight: 0,
        firstMiddleItem: 0,
        middleItemCount: 0,
        middlePlaceholderHeight: 0,
        lastItemCount: 0,
        scrollTo: 0,
        scrollTimes: 0,
    }

    renderItems(start, count, is_end)
    {
        let r = [];
        for (let i = 0; i < count; i++)
        {
            r.push(
                <div data-item={i+start} key={i+start}>
                    {this.props.renderItem(i+start)}
                </div>
            );
        }
        return r;
    }

    render()
    {
        if (this.state.totalItems && this.props.totalItems != this.state.totalItems &&
            this.state.scrollTimes <= 0)
        {
            // Automatically preserve scroll position when item count changes
            this.state.scrollTo = this.getItemScrollPos();
            this.state.scrollTimes = 2;
        }
        return (<div
            className={this.props.className}
            style={{
                position: 'relative',
                ...(this.props.style||{}),
                overflowAnchor: 'none',
            }}
            ref={this.setViewport}
            onScroll={this.onScroll}>
            {this.props.header}
            {this.state.targetHeight > 0
                ? <div key="target" style={{position: 'absolute', left: '-5px', width: '1px', height: this.state.targetHeight+'px'}}></div>
                : null}
            {this.state.topPlaceholderHeight
                ? <div style={{height: this.state.topPlaceholderHeight+'px'}} key="top"></div>
                : null}
            {this.renderItems(this.state.firstMiddleItem, this.state.middleItemCount)}
            {this.state.middlePlaceholderHeight
                ? <div style={{height: this.state.middlePlaceholderHeight+'px'}} key="mid"></div>
                : null}
            {this.renderItems(this.props.totalItems-this.state.lastItemCount, this.state.lastItemCount, true)}
        </div>);
    }

    setViewport = (e) =>
    {
        this.viewport = e;
    }

    getRenderedItemHeight = (index) =>
    {
        if (this.viewport)
        {
            const e = this.viewport.querySelector('div[data-item="'+index+'"]');
            if (e)
            {
                return e.getBoundingClientRect().height;
            }
        }
        return 0;
    }

    onScroll = () =>
    {
        this.driver();
    }

    componentDidUpdate = () =>
    {
        let changed = this.driver();
        if (!changed && this.state.scrollTimes > 0 && this.props.totalItems > 0)
        {
            // FIXME: It would be better to find a way to put this logic back into virtual-scroll-driver
            let pos = this.state.scrollTo;
            if (pos > this.state.scrollHeightInItems)
            {
                pos = this.state.scrollHeightInItems;
            }
            if (this.state.targetHeight)
            {
                this.viewport.scrollTop = Math.round((this.state.targetHeight - this.state.viewportHeight)*pos/this.state.scrollHeightInItems);
                this.setState({ scrollTimes: this.state.scrollTimes - 1 });
            }
            else
            {
                const el = this.viewport.querySelector('div[data-item="'+Math.floor(pos)+'"]');
                if (el)
                {
                    this.viewport.scrollTop = el.offsetTop - (this.props.headerHeight||0) + el.offsetHeight*(pos-Math.floor(pos));
                }
                this.setState({ scrollTimes: 0 });
            }
        }
    }

    componentDidMount()
    {
        this.driver();
    }

    scrollToItem = (pos) =>
    {
        // Scroll position must be recalculated twice, because first render
        // may change the average row height. In fact, it must be repeated
        // until average row height stops changing, but twice is usually sufficient
        this.setState({ scrollTo: pos, scrollTimes: 2 });
    }

    getItemScrollPos = () =>
    {
        if (this.state.targetHeight)
        {
            // Virtual scroll is active
            let pos = this.viewport.scrollTop / (this.state.targetHeight - this.state.viewportHeight);
            return pos * this.state.scrollHeightInItems;
        }
        else
        {
            // Virtual scroll is inactive
            let avgr = this.viewport.scrollHeight / this.state.totalItems;
            return this.viewport.scrollTop / avgr;
        }
    }

    driver = () =>
    {
        const newState = virtualScrollDriver(
            {
                totalItems: this.props.totalItems,
                minRowHeight: this.props.minRowHeight,
                viewportHeight: this.props.viewportHeight || (this.viewport.clientHeight-(this.props.headerHeight||0)),
                scrollTop: this.viewport.scrollTop,
            },
            this.state,
            this.getRenderedItemHeight
        );
        if (newState.viewportHeight || this.state.viewportHeight)
        {
            return this.setStateIfDiffers(newState);
        }
        return false;
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

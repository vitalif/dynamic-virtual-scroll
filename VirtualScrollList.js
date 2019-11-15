/**
 * A simple React list with virtual scrolling based on dynamic-virtual-scroll driver
 * USUALLY sufficient for everything including grids (using absolute sizing of cells).
 * Just because browsers can't do virtualized grid or table layouts efficiently.
 */

import React from 'react';
import ReactDOM from 'react-dom';
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

    setItemRef = []
    itemRefs = []
    itemRefCount = []

    makeRef(i)
    {
        this.setItemRef[i] = (e) =>
        {
            // If the new row instance is mounted before unmouting the old one,
            // we get called 2 times in wrong order: first with the new instance,
            // then with null telling us that the old one is unmounted.
            // We track reference count to workaround it.
            this.itemRefCount[i] = (this.itemRefCount[i]||0) + (e ? 1 : -1);
            if (e || !this.itemRefCount[i])
            {
                this.itemRefs[i] = e;
            }
        };
    }

    renderItems(start, count, is_end)
    {
        let r = [];
        for (let i = 0; i < count; i++)
        {
            let item = this.props.renderItem(i+start);
            if (item)
            {
                if (!this.setItemRef[i+start])
                {
                    this.makeRef(i+start);
                }
                r.push(<item.type {...item.props} key={i+start} ref={this.setItemRef[i+start]} />);
            }
        }
        return r;
    }

    render()
    {
        if (this.state.totalItems && this.props.totalItems != this.state.totalItems &&
            this.state.scrollTimes <= 0 && this.viewport && this.viewport.offsetParent)
        {
            // Automatically preserve scroll position when item count changes...
            // But only when the list is on-screen! We'll end up with an infinite update loop if it's off-screen.
            this.state.scrollTo = this.getItemScrollPos();
            this.state.scrollTimes = 2;
        }
        const props = { ...this.props };
        for (const k in VirtualScrollList.propTypes)
        {
            delete props[k];
        }
        return (<div
            {...props}
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
                ? <div key="target" style={{position: 'absolute', top: 0, left: '-5px', width: '1px', height: this.state.targetHeight+'px'}}></div>
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
        if (this.itemRefs[index])
        {
            const e = ReactDOM.findDOMNode(this.itemRefs[index]);
            if (e)
            {
                // MSIE sometimes manages to report non-integer element heights for elements of an integer height...
                // Non-integer element sizes are allowed in getBoundingClientRect, one notable example of them
                // are collapsed table borders. But we still ignore less than 1/100 of a pixel difference.
                return Math.round(e.getBoundingClientRect().height*100)/100;
            }
        }
        return 0;
    }

    onScroll = () =>
    {
        this.driver();
        if (this.props.onScroll)
        {
            this.props.onScroll(this.viewport);
        }
    }

    componentDidUpdate = () =>
    {
        let changed = this.driver();
        if (!changed && this.state.scrollTimes > 0 && this.props.totalItems > 0 &&
            this.viewport && this.viewport.offsetParent)
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
                const el = ReactDOM.findDOMNode(this.itemRefs[Math.floor(pos)]);
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
        if (!this.viewport || !this.viewport.offsetParent)
        {
            // Fool tolerance - do nothing if we are hidden
            return false;
        }
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

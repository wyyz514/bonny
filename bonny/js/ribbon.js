var BONNY_CONTAINER = ".ribbon-container";
var BONNY_ITEM = ".ribbon-item";
var current = null;

//generate ids for ribbons
function getName(parentName, index) {
    return parentName + "." + index;
}

//constructor for ribbon containers. they contain and initialize
//items (their dom kids)
function RibbonContainer(el, parent, id) {
    //body is the first ribbon to be init'd
    var isBody = id;
    this.parent = parent;
    this.type = "container";
    this.name = parent == null ? id : getName(this.parent, id);
    el.setAttribute('ribbon-id', this.name);
    this.ribbonItems = [];
    this.currentItem = -1;
    //pass parent == null bool value so the function
    //is aware of whether to use body as the selector
    this.extractItems(parent == null);
}

RibbonContainer.prototype.extractItems = function (isBody) {
    var parent = isBody ? RibbonUtils.getSelector(isBody, this) : RibbonUtils.getSelector(false, this);
    //select direct descendant items
    var itemsEl = Array.prototype.slice.call(document.querySelectorAll(parent + " > " + BONNY_ITEM));
    //keep track of unique items in a container
    var itemCounter = 0;
    this.ribbonItems = itemsEl.map(function (itemEl) {
        //reverse z index
        itemEl.style.zIndex = itemsEl.length - itemCounter;
        return new RibbonItem(itemEl, this.name, itemCounter ++); //continue recursive tree building since extractContainers is gonna be called for each extracted item
    }.bind(this));
    this.children = this.ribbonItems.length;
    return this.ribbonItems;
}

RibbonContainer.prototype.nextItem = function (start) {
    if(start >= 0) {
        return this.ribbonItems[start];
    } else {
        //we remain on the length of the kids if we have already visited all the kids. This way, when
        //we walk back, the currentItem will be length - 1 which is the last kid
        this.currentItem = this.currentItem < this.ribbonItems.length  ? this.currentItem + 1 : this.ribbonItems.length;
        //overflow condition
    }
    return this.ribbonItems[this.currentItem == this.ribbonItems.length ? this.ribbonItems.length : this.currentItem];
}

RibbonContainer.prototype.prevItem = function (start) {
    if(start >= 0) {
        return this.ribbonItems[start];
    } else {
        //we stay at -1 since this is representative of not being on any child currently
        //so when we step forward, currentItem = 0 and this is the first child
        this.currentItem = this.currentItem <= -1 ? this.currentItem : this.currentItem - 1;
        //underflow condition
    }
    //not sure why "this" is being returned 
    return this.ribbonItems[this.currentItem] ? this.ribbonItems[this.currentItem] : this;
}

function RibbonItem(el, container, id) {
    this.parent = container;
    this.type = "item";
    this.name = getName(this.parent, id);
    el.setAttribute('ribbon-id', this.name);
    this.ribbonContainers = [];
    this.currentContainer = -1;
    this.extractContainers();
}

RibbonItem.prototype.extractContainers = function () {
    var containersEl = Array.prototype.slice.call(document.querySelectorAll(RibbonUtils.getSelector(false, this) + " > " + BONNY_CONTAINER));
    var containerCount = 0;
    this.ribbonContainers = containersEl.map(function (containerEl) {
        containerEl.style.zIndex = containersEl.length - containerCount;
        return new RibbonContainer(containerEl, this.name, containerCount ++);
    }.bind(this));
    this.children = this.ribbonContainers.length;
    return this.ribbonContainers;
}

RibbonItem.prototype.nextContainer = function (start) {
    if(start >= 0) {
        return this.ribbonContainers[start];
    } else {
        //we remain on the length of the kids if we have already visited all the kids. This way, when
        //we walk back, the currentItem will be length - 1 which is the last kid
        this.currentContainer = this.currentContainer < this.ribbonContainers.length  ? this.currentContainer + 1 : this.ribbonContainers.length;
        //overflow condition
    }
    return this.ribbonContainers[this.currentContainer == this.ribbonContainers.length ? this.ribbonContainers.length - 1 : this.currentContainer];
}

RibbonItem.prototype.prevContainer = function (start) {
    if(start >= 0) {
        return this.ribbonContainers[start];
    } else {
        //we stay at -1 since this is representative of not being on any child currently
        //so when we step forward, currentItem = 0 and this is the first child
        this.currentContainer = this.currentContainer <= -1 ? this.currentContainer : this.currentContainer - 1;
        //underflow condition
    }
    return this.ribbonContainers[this.currentContainer] ? this.ribbonContainers[this.currentContainer] : this;
}

function tab(num) {
    toReturn = "";
    for(var i = 0; i < num; i++) {
        toReturn += "\t";
    }
    return toReturn;
}

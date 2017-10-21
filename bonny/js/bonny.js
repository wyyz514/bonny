var BONNY_CONTAINER = ".bonny-container";
var BONNY_ITEM = ".bonny-item";
var current = null;

//generate ids for bonnys
function getName(parentName, index) {
    return parentName + "." + index;
}

//constructor for bonny containers. they contain and initialize
//items (their dom kids)
function BonnyContainer(el, parent, id) {
    //body is the first bonny to be init'd
    var isBody = id;
    this.parent = parent;
    this.type = "container";
    this.name = parent == null ? id : getName(this.parent, id);
    el.setAttribute('bonny-id', this.name);
    this.bonnyItems = [];
    this.currentItem = -1;
    //pass parent == null bool value so the function
    //is aware of whether to use body as the selector
    this.extractItems(parent == null);
}

BonnyContainer.prototype.extractItems = function (isBody) {
    var parent = isBody ? BonnyUtils.getSelector(isBody, this) : BonnyUtils.getSelector(false, this);
    //select direct descendant items
    var itemsEl = Array.prototype.slice.call(document.querySelectorAll(parent + " > " + BONNY_ITEM));
    //keep track of unique items in a container
    var itemCounter = 0;
    this.bonnyItems = itemsEl.map(function (itemEl) {
        //reverse z index
        itemEl.style.zIndex = itemsEl.length - itemCounter;
        return new BonnyItem(itemEl, this.name, itemCounter ++); //continue recursive tree building since extractContainers is gonna be called for each extracted item
    }.bind(this));
    this.children = this.bonnyItems.length;
    return this.bonnyItems;
}

BonnyContainer.prototype.nextItem = function (start) {
    if(start >= 0) {
        return this.bonnyItems[start];
    } else {
        //we remain on the length of the kids if we have already visited all the kids. This way, when
        //we walk back, the currentItem will be length - 1 which is the last kid
        this.currentItem = this.currentItem < this.bonnyItems.length  ? this.currentItem + 1 : this.bonnyItems.length;
        //overflow condition
    }
    return this.bonnyItems[this.currentItem == this.bonnyItems.length ? this.bonnyItems.length : this.currentItem];
}

BonnyContainer.prototype.prevItem = function (start) {
    if(start >= 0) {
        return this.bonnyItems[start];
    } else {
        //we stay at -1 since this is representative of not being on any child currently
        //so when we step forward, currentItem = 0 and this is the first child
        this.currentItem = this.currentItem <= -1 ? this.currentItem : this.currentItem - 1;
        //underflow condition
    }
    //not sure why "this" is being returned 
    return this.bonnyItems[this.currentItem] ? this.bonnyItems[this.currentItem] : this;
}

function BonnyItem(el, container, id) {
    this.parent = container;
    this.type = "item";
    this.name = getName(this.parent, id);
    el.setAttribute('bonny-id', this.name);
    this.bonnyContainers = [];
    this.currentContainer = -1;
    this.extractContainers();
}

BonnyItem.prototype.extractContainers = function () {
    var containersEl = Array.prototype.slice.call(document.querySelectorAll(BonnyUtils.getSelector(false, this) + " > " + BONNY_CONTAINER));
    var containerCount = 0;
    this.bonnyContainers = containersEl.map(function (containerEl) {
        containerEl.style.zIndex = containersEl.length - containerCount;
        return new BonnyContainer(containerEl, this.name, containerCount ++);
    }.bind(this));
    this.children = this.bonnyContainers.length;
    return this.bonnyContainers;
}

BonnyItem.prototype.nextContainer = function (start) {
    if(start >= 0) {
        return this.bonnyContainers[start];
    } else {
        //we remain on the length of the kids if we have already visited all the kids. This way, when
        //we walk back, the currentItem will be length - 1 which is the last kid
        this.currentContainer = this.currentContainer < this.bonnyContainers.length  ? this.currentContainer + 1 : this.bonnyContainers.length;
        //overflow condition
    }
    return this.bonnyContainers[this.currentContainer == this.bonnyContainers.length ? this.bonnyContainers.length - 1 : this.currentContainer];
}

BonnyItem.prototype.prevContainer = function (start) {
    if(start >= 0) {
        return this.bonnyContainers[start];
    } else {
        //we stay at -1 since this is representative of not being on any child currently
        //so when we step forward, currentItem = 0 and this is the first child
        this.currentContainer = this.currentContainer <= -1 ? this.currentContainer : this.currentContainer - 1;
        //underflow condition
    }
    return this.bonnyContainers[this.currentContainer] ? this.bonnyContainers[this.currentContainer] : this;
}

function tab(num) {
    toReturn = "";
    for(var i = 0; i < num; i++) {
        toReturn += "\t";
    }
    return toReturn;
}

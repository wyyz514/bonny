var RibbonUtils = (function(){

    var globals = {
        //bounds are 0 and number of top level items - 1
        currentRibbon: 0,
        root: null
    };

    var _globals = {
        get: function get(prop) {
            var propCopies = {};

            if (!prop) {
                return null;
            }

            if (typeof prop == "string") {
                return globals[prop];
            }
            //if an array of props passed,
            //populate an object to be returned
            prop.map(function(p){
                if (globals[p]) {
                    propCopies[p] = globals[p];
                }
                return p;
            });

            return propCopies;
        },
        set: function set(prop, value) {
            if (!prop) {
                return null;
            }

            if (typeof prop == "string") {
                globals[prop] = value;
                return value;
            }
            //if an object is passed, 
            //override the previous properties
            if (typeof prop == "object") {
                var keys = Object.keys(prop);
                keys.map(function(keyProp) {
                    globals[keyProp] = prop[keyProp];
                })
            }
        },

        //shitty walk function since it has to start from root each
        //time but if it aint broke...
        walk: function walk(name, root) {
            var path = name.split(".");
            var pathIndex = 1;
            var pathLength = path.length;

            function walker(p, i, current) {
                var toPassNext = null;
                //since we start from index 1 to ignore the body container in index 0,
                //if the path does not have a definition, then return where we currently are
                //so for instance if the name passed is just 1, then there is no index 1 in the array
                //so simply return current which is the body root in this case

                //also return if the path index is greater than or equal to the number of children
                //of the current item/container to prevent out of bounds
                if(i >= pathLength || p[i] == undefined || p[i] >= current.children) {
                    return current;
                }

                if (current.type == "item") {
                    //0 to return first child
                    //check nextContainer function
                    var containerCount = 0;
                    var container = null;

                    while( containerCount <= parseInt(p[i]) ) {
                        container = current.nextContainer(containerCount);
                        containerCount += 1;
                    }
                    toPassNext = container;

                } else {
                    var itemCount = 0;
                    var item = null;

                    while( itemCount <= parseInt(p[i]) ) {
                        item = current.nextItem(itemCount);
                        itemCount += 1;
                    }
                    toPassNext = item;
                }

                return walker(p, i + 1, toPassNext);
            }

            return walker(path, pathIndex, root);
        },

        collectMouseScrolls: function collectMouseScrolls() {
            //leverage scoping to populate the scrolls array
            //each time the nested function is called
            var scrolls = [];

            return function _collectMouseScrolls(scroll) {

                if (scrolls.length < 3 ) {
                    scrolls.push(scroll);
                    return {
                        //override normal promise behavior
                        //if promise not returned when this _collectMouseScrolls is called
                        then: function(cb) {
                        }
                    };
                }
                else {
                    //use sum of the array to determine which direction
                    //to go
                    var sum = scrolls.reduce(function(prev, next) {
                        return prev + next;
                    }, 0);
                    //empty array once we've collected the bottleneck scroll value
                    scrolls = [];
                    return new Promise(function(resolve, reject){
                        resolve((sum < 0 ? "up" : "down"));
                    });
                }
            }
        },

        changeRibbon: function changeRibbon(direction) {
            //function to calculate what page we on
            var currentPage = function() {
                return this.get("currentRibbon") % this.get('root').children;
            }.bind(this);

            var ribbonSelector = this.getSelector(false, this.get('root').ribbonItems[currentPage()]);
            var el = document.querySelector(ribbonSelector);
            var noScrollUp = el.classList.contains('no-up');
            var noScrollDown = el.classList.contains('no-down');

            //going from first to last
            if (direction == "down" && !noScrollDown) {

                this.set('currentRibbon', this.get('currentRibbon') + 1);
                current = this.get('root').ribbonItems[currentPage()];
                //get current page element
                el = document.querySelector(this.getSelector(false, current));
                //transition the previous page
                el.previousElementSibling.classList.add('fade');
                //shift indicator
                RibbonIndicators.next();
            }
            //going from last to first
            else if(direction == "up" && !noScrollUp) {
                this.set('currentRibbon', this.get('currentRibbon') - 1);
                current = this.get('root').ribbonItems[currentPage()];
                el = document.querySelector(this.getSelector(false, current));
                el.classList.remove('fade');
                RibbonIndicators.previous();
            }
            else {
                //do nothing for out of bounds events
            }

            return current;
        },

        //step through all the children of a node
        //step out to the node's parent when done
        step: function step(root) {
            var currentNode = root;
            return {
                stepForward: function _step(node) {
                    if (node) {
                        currentNode = node;
                    }
                    var bound = currentNode.children - 1;
                    //if the current child index of the node we are on is strictly less
                    //than the number of children - 1, we can get the next child. We can't 
                    //get the next child if we are on the last child index because there is no
                    //next child hence the step out in the else condition to return to the parent
                    //when the index increments to the number of children
                    if(this.currentChild(currentNode) < bound && bound != -1) {
                        currentNode = currentNode.type === "container" ? currentNode.nextItem() : currentNode.nextContainer();
                    }
                    //when body is reached and all its children have been walked, just return it
                    else if(currentNode.name == "1") {
                        return currentNode;
                    }
                    else {
                        //we have walked the current node's children, so return to the current node's parent to walk its siblings if any
                        //(currentNode.currentItem ? currentNode.currentItem = -1 : currentNode.currentContainer = -1);
                        currentNode = this.stepOut(currentNode, 1);
                    }
                    return currentNode;
                }.bind(this)
                ,
                stepBack: function _stepBack(node) {
                    if (node) {
                        currentNode = node;
                    }

                    var bound = currentNode.children - 1;
                    //we need the current child index here to be strictly greater than 0
                    //that way if we keep walking back, the last child we walk is the one
                    //with the 0th index or the first child
                    //if we are on the first child, and we attempt to step back, we need to step out to the parent since
                    //no more children exist prior to the first (else condition)
                    if(this.currentChild(currentNode) > 0 && bound != -1) {
                        currentNode = currentNode.type === "container" ? currentNode.prevItem() : currentNode.prevContainer();
                    }
                    //can't step back from the root
                    else if(currentNode.name == "1") {
                        return currentNode;
                    }
                    else {
                        //(currentNode.currentItem ? currentNode.currentItem = -1 : currentNode.currentContainer = -1);
                        currentNode = this.stepOut(currentNode, -1);
                    }
                    return currentNode;
                }.bind(this)
            }
        },

        stepOut: function stepOut(node) {
            var name = node.name;
            //remove last digit and preceding dot to get parent address

            var parentName = name.slice(0, name.length - 2);
            //walk to the parent of the current node from root since this is
            //where we will be stepping out to
            var parent = this.walk(parentName, globals.root);
            //if the parent is currently on its last child and we pass a 1 
            //(to indicate we want to overshoot the bound by 1, so when we step back, we arrive on the last child)
            //and the parent has kids, then increment the currrentChild index of the parent
            if(this.currentChild(parent) == parent.children - 1 && arguments[1] == 1 && parent.children != 0) {
                this.nextChild(parent);
            }
            //if we're stepping back and we are on the parent's first child, then decrement the currentChild index
            //to -1 so when we step forward, we will be on the first child
            if(this.currentChild(parent) == 0 && arguments[1] == -1) {
                this.previousChild(parent);
            }
            // else
            // (parent.currentItem ? parent.children : parent.children);
            //return the parent we stepped out to
            return parent;
        },

        currentChild: function currentChild(ribbon) { 
            //return index of the child we are on given the parent ()
            if(ribbon.type == 'item') {
                return ribbon.currentContainer;
            }
            else if(ribbon.type == 'container') {
                return ribbon.currentItem;
            }
            else {
                return null;
            }
        },

        previousChild: function previousChild(ribbon) {
            if(ribbon.type == 'item') {
                return ribbon.currentContainer < 0 ? -1 : ribbon.currentContainer -= 1;
            }
            else  if(ribbon.type == 'container') {
                return ribbon.currentItem < 0 ? -1 : ribbon.currentItem -= 1;
            }
            else {
                return null;
            }
        },

        nextChild: function nextChild(ribbon) {
            if(ribbon.type == 'item') {
                return ribbon.currentContainer += 1;
            }
            else  if(ribbon.type == 'container') {
                return ribbon.currentItem += 1;
            }
            else {
                return null;
            }
        },

        getSelector: function getSelector(isBody, ribbon) {
            if (isBody) {
                return 'body[ribbon-id="'+ribbon.name+'"]';
            }

            if (ribbon.type == "item") {
                return '.ribbon-item[ribbon-id="'+ribbon.name+'"]'
            }

            if (ribbon.type == "container") {
                return '.ribbon-container[ribbon-id="'+ribbon.name+'"]'
            }

            return "";
        },
        execute: function execute(scroll, directions) {
            var self = this;

            this.collectMouseScrolls(scroll).then(function(direction){
                var currentRibbon = self.get('root').ribbonItems[self.get('currentRibbon')];
                console.log(currentRibbon);
                RibbonTransitions.trigger(currentRibbon, direction, directions);
            });
        }
    }



    return {
        walk: function(name, root) {
            return _globals.walk(name, root);
        },
        collectMouseScrolls: _globals.collectMouseScrolls(),
        changeRibbon: function(direction) {
            return _globals.changeRibbon(direction);    
        },
        step: function(root) {
            return _globals.step(root);
        },
        stepOut: function(root) {
            return _globals.stepOut(root);        
        },
        execute: function(scroll, directions) {
            return _globals.execute.call(this, scroll, directions);
        },
        getSelector: function(isBody, ribbon) {
            return _globals.getSelector(isBody, ribbon);
        },
        set: function(prop, value) {
            return _globals.set(prop, value);    
        },
        get: function(prop) {
            return _globals.get(prop);
        },
        currentChild: function(ribbon) {
            return _globals.currentChild(ribbon);
        },
        previousChild: function(ribbon) {
            return _globals.previousChild(ribbon);
        },
        nextChild: function(ribbon) {
            return _globals.nextChild(ribbon);
        }
    }
})();

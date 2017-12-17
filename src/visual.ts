/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
module powerbi.extensibility.visual {
    export class Visual implements IVisual {
        private target: HTMLElement;
        private host: IVisualHost;
        private settings: VisualSettings;
        private selectionManager: ISelectionManager;

        constructor(options: VisualConstructorOptions) {
            this.target = options.element;
            this.host = options.host;
            this.selectionManager = this.host.createSelectionManager();
            if (typeof document !== "undefined") {
                // Create sample when visual is instantiated
                const new_ul: HTMLElement = document.createElement("ul");
                new_ul.setAttribute("class", "scroll-box");
                const new_li1: HTMLElement = document.createElement("li");
                new_li1.setAttribute("class", "him");
                new_li1.appendChild(document.createTextNode("Create chat bubbles over here..."));
                const new_li2: HTMLElement = document.createElement("li");
                new_li2.setAttribute("class", "me");
                new_li2.appendChild(document.createTextNode("...or over here!"));
                const new_li3: HTMLElement = document.createElement("li");
                new_li3.setAttribute("class", "him");
                new_li3.appendChild(document.createTextNode("Set the color of the left/right bubbles..."));
                const new_li4: HTMLElement = document.createElement("li");
                new_li4.setAttribute("class", "me");
                new_li4.appendChild(document.createTextNode("...including font!"));
                const new_li5: HTMLElement = document.createElement("li");
                new_li5.setAttribute("class", "him");
                new_li5.appendChild(document.createTextNode("Autoscroll option in properties"));
                new_ul.appendChild(new_li1);
                new_ul.appendChild(new_li2);
                new_ul.appendChild(new_li3);
                new_ul.appendChild(new_li4);
                new_ul.appendChild(new_li5);
                this.target.appendChild(new_ul);
            }
        }

        public update(options: VisualUpdateOptions) {
            this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
            if (!options.dataViews) return;
            let dataView: DataView = options && options.dataViews && options.dataViews[0];
            if (dataView.categorical.categories.length > 0) {
                while (this.target.firstChild) {
                    this.target.removeChild(this.target.firstChild)
                }
                let bubbleIDS = Visual.getSelectionIds(dataView, this.host);
                let lBubble: any[] = dataView.categorical.categories[0].values as any[];
                let rBubble: any[] = [];
                if (dataView.categorical.categories.length > 1) {
                    rBubble = dataView.categorical.categories[1].values as any[];
                }
                const new_ul: HTMLElement = document.createElement("ul");
                new_ul.setAttribute("class", "scroll-box");
                // Loop through both data buckets creating bubbles every other time
                for (var i = 0; i < Math.max(lBubble.length, rBubble.length); i++) {
                    if (i < lBubble.length) {
                        const new_li1: HTMLElement = document.createElement("li");
                        new_li1.setAttribute("class", "him");
                        new_li1.setAttribute("id", i.toString());
                        new_li1.setAttribute("style", "background: " + this.settings.dataPoint.leftColor + "; color: " + this.settings.dataPoint.leftFont + ";");
                        new_li1.appendChild(document.createTextNode(lBubble[i]));
                        new_li1.onclick = (ev: MouseEvent) => {
                            this.selectionManager.select(bubbleIDS[new_li1.getAttribute("id")]).then((ids: ISelectionId[]) => {
                            });
                            ev.stopPropagation();
                        };
                        new_ul.appendChild(new_li1);
                    }
                    if (i < rBubble.length) {
                        const new_li2: HTMLElement = document.createElement("li");
                        new_li2.setAttribute("class", "me");
                        new_li2.setAttribute("id", i.toString());
                        new_li2.setAttribute("style", "background: " + this.settings.dataPoint.rightColor + "; color: " + this.settings.dataPoint.rightFont + ";");
                        new_li2.appendChild(document.createTextNode(rBubble[i]));
                        new_li2.onclick = (ev: MouseEvent) => {
                            this.selectionManager.select(bubbleIDS[new_li2.getAttribute("id")]).then((ids: ISelectionId[]) => {
                            });
                            ev.stopPropagation();
                        };
                        new_ul.appendChild(new_li2);
                    }
                }
                this.target.appendChild(new_ul);
                this.target.onclick = (ev: MouseEvent) => {
                    this.selectionManager.clear().then(() => {
                    });
                    ev.stopPropagation();
                };
                if (this.settings.dataPoint.scrollBottom) {
                    this.scrollToBottom(new_ul);
                }
            }
        }

        // Helper method to scroll to bottom
        public animateScroll(duration, new_ul) {
            var start = new_ul.scrollTop;
            var end = new_ul.scrollHeight;
            var change = end - start;
            var increment = 20;
            function easeInOut(currentTime, start, change, duration) {
                // by Robert Penner
                currentTime /= duration / 2;
                if (currentTime < 1) {
                    return change / 2 * currentTime * currentTime + start;
                }
                currentTime -= 1;
                return -change / 2 * (currentTime * (currentTime - 2) - 1) + start;
            }
            function animate(elapsedTime) {
                elapsedTime += increment;
                var position = easeInOut(elapsedTime, start, change, duration);
                new_ul.scrollTop = position;
                if (elapsedTime < duration) {
                    setTimeout(function () {
                        animate(elapsedTime);
                    }, increment)
                }
            }
            animate(0);
        }

        // Callback function for scrolling
        public scrollToBottom(new_ul) {
            var duration = 1000;
            this.animateScroll(duration, new_ul);
        }

        // Gets the selection ids for a Table custom visual
        private static getSelectionIds(dataView: DataView, host: IVisualHost): ISelectionId[] {
            return dataView.table.identity.map((identity: DataViewScopeIdentity) => {
                const categoryColumn: DataViewCategoryColumn = {
                    source: dataView.table.columns[0],
                    values: null,
                    identity: [identity]
                };
                return host.createSelectionIdBuilder()
                    .withCategory(categoryColumn, 0)
                    .createSelectionId();
            });
        }

        // Parse the settings in the settings.ts file
        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        /** 
         * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the 
         * objects and properties you want to expose to the users in the property pane.
         * 
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
            return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }

    }
}
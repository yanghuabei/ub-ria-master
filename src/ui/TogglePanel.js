/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2014 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 折叠控件
 * @author wangyaqiong
 */

define(
    function (require) {
        var Control = require('esui/Control');
        var lib = require('esui/lib');
        var ui = require('esui');

        require('esui/Panel');

        /**
         * 折叠控件
         */
        function TogglePanel() {
            Control.apply(this, arguments);
        }

        TogglePanel.prototype.type = 'TogglePanel';

        /**
         * 初始化参数
         *
         * @param {Object} options 构造函数传入的参数
         * @override
         * @protected
         */
        TogglePanel.prototype.initOptions = function (options) {
            var defaults = {
                expanded: false
            };

            var properties = lib.extend(defaults, options);

            this.setProperties(properties);
        };

        /**
         * 初始化DOM结构
         *
         * @override
         * @protected
         */
        TogglePanel.prototype.initStructure = function () {
            var children = lib.getChildren(this.main);
            var titleElem = children[0];
            var contentElem = children[1];

            var titlePanel = ui.create('Panel', { main: titleElem });
            this.helper.addPartClasses('title', titlePanel.main);
            this.addChild(titlePanel, 'title');
            this.set('title', titleElem && titleElem.innerHTML);
            titlePanel.helper.addDOMEvent(titlePanel.main, 'click', lib.bind(onToggle, this));

            var contentPanel = ui.create('Panel', { main: contentElem });
            this.helper.addPartClasses('content', contentPanel.main);
            this.addChild(contentPanel, 'content');
            this.set('content', contentElem && contentElem.innerHTML);
        };

        function onToggle() {
            this.toggleState('expanded');
            this.fire('change');
        }

        var painters = require('esui/painters');
        /**
         * 重绘
         *
         * @override
         * @protected
         */
        TogglePanel.prototype.repaint = painters.createRepaint(
            Control.prototype.repaint,
            painters.state('expanded'),
            {
                name: 'title',
                paint: function (panel, title) {
                    panel.getChild('title').set('content', title);
                }
            },
            {
                name: 'content',
                paint: function (panel, content) {
                    panel.getChild('content').set('content', content);
                }
            }
        );

        TogglePanel.prototype.isExpanded = function () {
            return this.hasState('expanded');
        };

        lib.inherits(TogglePanel, Control);
        ui.register(TogglePanel);
        return TogglePanel;
    }
);

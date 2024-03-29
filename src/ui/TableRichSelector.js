/**
 * ADM 2.0
 * Copyright 2014 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 选择控件中所用到的列表形结构
 * @author lixiang(lixiang05@baidu.com)
 */

define(
    function (require) {
        var lib = require('esui/lib');
        var painter = require('esui/painters');
        var u = require('underscore');

        var util = require('ub-ria/util');
        var RichSelector = require('ub-ria/ui/RichSelector');


        /**
         * 控件类
         *
         * @constructor
         * @param {Object} options 初始化参数
         */
        function TableRichSelector(options) {
            RichSelector.apply(this, arguments);
        }

        lib.inherits(TableRichSelector, RichSelector);

        TableRichSelector.prototype.type = 'TableRichSelector';
        TableRichSelector.prototype.styleType = 'RichSelector';

        TableRichSelector.prototype.initOptions = function (options) {
            var properties = {
                hasRowHead: true,
                hasIcon: true,
                // 是否触发在图标上
                firedOnIcon: false,
                // 数据源
                datasource: [],
                // 选择数据
                selectedData: [],
                // 字段
                fields: []
            };

            if (options.hasRowHead === 'false') {
                options.hasRowHead = false;
            }

            if (options.hasIcon === 'false') {
                options.hasIcon = false;
            }

            if (options.firedOnIcon === 'false') {
                options.firedOnIcon = false;
            }

            lib.extend(properties, options);
            RichSelector.prototype.initOptions.call(this, properties);
        };

        TableRichSelector.prototype.initStructure = function () {
            RichSelector.prototype.initStructure.apply(this, arguments);
            lib.addClass(
                this.main,
                'ui-table-richselector'
            );
        };
        /**
         * 重新渲染视图
         * 仅当生命周期处于RENDER时，该方法才重新渲染
         *
         * @param {Array=} 变更过的属性的集合
         * @override
         */
        TableRichSelector.prototype.repaint = painter.createRepaint(
            RichSelector.prototype.repaint,
            {
                name: ['datasource', 'selectedData', 'disabledData'],
                paint:
                    function (control, datasource, selectedData, disabledData) {
                        control.refresh();
                    }
            }
        );

        /**
         * 构建List可以使用的数据结构
         * 用户传入数据：
         * —— datasource
         * {
         *     allData: [{id: xxx, name: xxx}, {id: yyy, name: yyyy}...]
         *     selectedData: [{id: zz, name: zzzz}, {id: mm, name: mmmm}...]
         * }
         * 将allData和SelectedData映射转换后
         * —— mixedDatasource
         * [
         *    {id: xxx, name: xxx, isSelected: false},
         *    {id: yyy, name: yyyy, isSelected: false}
         *    ...
         * ]
         * —— indexData （就是一个以id为key，index做value的映射表）
         *
         * @override
         */
        TableRichSelector.prototype.adaptData = function () {
            var allData = util.deepClone(this.datasource);
            // 先构建indexData
            var indexData = {};
            u.each(allData, function (item, index) {
                indexData[item.id] = index;
            });
            this.indexData = indexData;

            // 把选择状态merge进allData的数据项中
            var selectedData = this.selectedData || [];
            // 单选模式，保存第一个值为当前选值
            if (!this.multi && selectedData.length) {
                this.curSeleId = selectedData[0]['id'];
            }
            u.each(selectedData, function (item, index) {
                var selectedIndex = indexData[item.id];
                // 有可能出现已选的数据在备选中已经被删除的情况
                // 此时selectedIndex会取到undefined，不做加标记处理
                if (selectedIndex !== undefined) {
                    allData[selectedIndex].isSelected = true;
                }
            });

            var disabledData = this.disabledData || [];
            u.each(disabledData, function (item, index) {
                var selectedIndex = indexData[item.id];
                if (selectedIndex !== undefined) {
                    allData[selectedIndex].isDisabled = true;
                }
            });
            this.allData = allData;
        };

        /**
         * 更新备选区
         * 
         * @override
         */
        TableRichSelector.prototype.refreshContent = function () {
            var data = this.isQuery() ? this.queriedData : this.allData;
            if (!data || data.length === 0) {
                this.addState('empty');
            }
            else {
                this.removeState('empty');
            }

            // 开始构建
            var htmlArray = [];
            if (this.hasRowHead) {
                htmlArray.push(createTableHead(this));
            }
            htmlArray.push(createTableContent(this, data));

            var queryList = this.getQueryList();
            queryList.setContent(htmlArray.join(''));
        };

        /**
         * 创建表头
         *
         * public
         * @return {string} 表头html
         */
        function createTableHead(control) {
            var tableClass = control.helper.getPartClassName('head-table');
            var tpl = ['<table border=0 class="' + tableClass + '"><tr>'];
            var colmNum = control.fields.length;
            //绘制表头th
            for(var i = 0; i < colmNum; i ++){
                var field = control.fields[i];
                tpl.push(''
                    + '<th class="th' + i + '"'
                    + ' style="width:' + field.width + 'px;">'
                    + field.title || ''
                    + '</th>'
                );
            }
            //最后一列用来装箭头
            tpl.push('<th style="width:30px;"></th>');
            tpl.push('</tr></table>');
            return tpl.join(' ');
        }

        TableRichSelector.prototype.rowTpl = ''
            + '<tr id="${rowId}" class="${rowClass}" '
            + 'index="${index}">${content}</tr>';

        /**
         * 创建表格体
         * @param {ui.TableForSelector} control 类实例
         * @ignore
         */
        function createTableContent(control, data) {
            var indexData = control.indexData;
            var helper = control.helper;

            var tableClasses = helper.getPartClassName('content-table');
            var tpl = ['<table border=0 class="' + tableClasses + '">'];
            var baseRowClasses = helper.getPartClassName('row');
            var selectedRowClasses = helper.getPartClassName('row-selected');
            var disabledRowClasses = helper.getPartClassName('row-disabled');

            //绘制内容
            u.each(data, function (item, index) {
                var rowClasses = [baseRowClasses];
                if (item.isSelected) {
                    rowClasses.push(selectedRowClasses);
                }
                if (item.isDisabled) {
                    rowClasses.push(disabledRowClasses);
                }
                tpl.push(
                    lib.format(
                        control.rowTpl,
                        {
                            rowId: control.helper.getId('row-' + item.id),
                            rowClass: rowClasses.join(' '),
                            index: indexData[item.id],
                            content: createRow(control, item, index)
                        }
                    )
                );
            });
            tpl.push('</table>');
            return tpl.join(' ');
        }

        /**
         * 创建Table的每行
         *
         * @param {ui.TableForSelector} control 类实例
         * @param {Object} item 每行的数据
         * @param {number} index 行索引
         * @param {HTMLElement} tr 容器节点
         * @ignore
         */
        function createRow(control, item, index, tr){
            var fields = control.fields;
            var html = [];
            var fieldClasses = control.helper.getPartClassName('row-field');
            u.each(fields, function (field, i) {
                var content = field.content;
                var innerHTML = ('function' == typeof content
                    ? content.call(control, item, index, i)
                    : item[content]);

                //IE不支持tr.innerHTML，所以这里要使用insertCell
                if(tr) {
                    var td = tr.insertCell(i);
                    td.style.width = field.width + 'px';
                    td.title = innerHTML;
                    td.innerHTML = innerHTML;
                }
                else {
                    var contentHtml = ''
                        + '<td class="' + fieldClasses
                        + '" title="' + innerHTML
                        + '" style="width:' + field.width + 'px;">'
                        + innerHTML
                        + '</td>';
                    html.push(contentHtml);
                }
            });

            //最后一列添加箭头
            var arrowClasses = 
                control.helper.getPartClassName('row-action-icon');
            var arrowHTML = '<span class="' + arrowClasses + '"></span>';
            if(tr) {
                var td = tr.insertCell(i);
                td.style.width = '30px';
                td.innerHTML = arrowHTML;
            }
            else {
                html.push('<td style="width:30px;">' + arrowHTML + '</td>');
                return html.join(' ');
            }
        }

        /**
         * 点击行为分发器
         * @param {Event} 事件对象
         * @ignore
         */
        TableRichSelector.prototype.eventDispatcher = function (e) {
            var tar = e.target;
            var helper = this.helper;
            var rowClasses = helper.getPartClassName('row');
            var actionClasses = helper.getPartClassName('row-action-icon');

            while (tar && tar != document.body) {
                var rowDOM;
                // 有图标的事件触发在图标上
                if (this.hasIcon
                    && this.fireOnIcon
                    && lib.hasClass(tar, actionClasses)) {
                    rowDOM = tar.parentNode;
                }
                else {
                    if (lib.hasClass(tar, rowClasses)) {
                        rowDOM = tar;
                    }
                }
                if (rowDOM) {
                    this.operateRow(rowDOM);
                    return;
                }

                tar = tar.parentNode;
            }
        };

        // 可重写
        TableRichSelector.prototype.operateRow = function (row) {
            var disabledClasses = this.helper.getPartClassName('row-disabled');
            if (lib.hasClass(row, disabledClasses)) {
                return;
            }
            var index = parseInt(row.getAttribute('index'), 10);
            var item = this.allData[index];
            if (!item) {
                return;
            }

            if (this.mode === 'add') {
                actionForAdd(this, row, item);
            }
            else if (this.mode === 'delete') {
                actionForDelete(this, row, item);
            }
            else if (this.mode === 'load') {
                actionForLoad(this, row, item);
            }
        };

        function actionForAdd(control, row, item) {
            var selectedClasses = 
                control.helper.getPartClassName('row-selected');
            var fire = false;
            // 点击已选中的，在单选模式下，执行取消选择
            if (lib.hasClass(row, selectedClasses)) {
                if (!control.multi) {
                    selectItem(control, item.id, false);
                    fire = true;
                }
            }
            else {
                selectItem(control, item.id, true);
                fire = true;
            }

            if (fire) {
                control.fire('add');
            }
        }

        /**
         * 选择或取消选择
         *   如果控件是单选的，则将自己置灰且将其他节点恢复可选
         *   如果控件是多选的，则仅将自己置灰
         *
         * @param {ui.TableRichSelector} control 类实例
         * @param {Object} id 结点对象id
         * @param {boolean} toBeSelected 置为选择还是取消选择
         *
         * @ignore
         */
        function selectItem(control, id, toBeSelected) {
            // 完整数据
            var indexData = control.indexData;
            var data = control.allData;

            var index = indexData[id];
            var item = data[index];

            //如果是单选，需要将其他的已选项置为未选
            if (!control.multi) {
                // 移除原有选项
                unselectCurrent(control);
                // 赋予新值
                control.curSeleId = toBeSelected ? id : null;
            }
            updateSingleItemStatus(control, item, toBeSelected);
        }

        //撤销选择当前项
        function unselectCurrent(control) {
            var curId = control.curSeleId;
            //撤销当前选中项
            if (curId) {
                var index = control.indexData[curId];
                var item = control.allData[index];
                updateSingleItemStatus(control, item, false);
                control.curSeleId = null;
            }
        }

        /**
         * 更新单个结点状态
         *
         * @param {ui.TableRichSelector} control 类实例
         * @param {Object} item 结点数据对象
         * @param {boolean} toBeSelected 置为选择还是取消选择
         *
         * @ignore
         */
        function updateSingleItemStatus(control, item, toBeSelected) {
            if (!item) {
                return;
            }
            item.isSelected = toBeSelected;
            var itemDOM = control.helper.getPart('row-' + item.id);
            var changeClass = toBeSelected ? lib.addClass : lib.removeClass;
            changeClass(
                itemDOM,
                control.helper.getPartClassName('row-selected')
            );
        }

        /**
         * 选择全部
         * 如果当前处于搜索状态，那么只把搜索结果中未选择的选过去
         * @public
         */
        TableRichSelector.prototype.selectAll = function () {
            var data = this.isQuery() ? this.queriedData : this.allData;
            var control = this;
            u.each(data, function (item) {
                selectItem(control, item.id, true);
            });
            this.fire('add');
        };

        /**
         * 批量更新选择状态，
         * 用于外部调用，因此不触发事件
         *
         * @param {Array} items 需要更新的对象集合或id集合
         * @param {boolean} toBeSelected 要选择还是取消选择
         * @override
         */
        TableRichSelector.prototype.selectItems =
            function (items, toBeSelected) {
                var allData = this.allData;
                var indexData = this.indexData;
                var control = this;
                u.each(items, function (item) {
                    var id = item['id'] !== 'undefined' ? item['id'] : item;
                    var itemIndex = indexData[id];
                    if (itemIndex !== null && itemIndex !== undefined) {
                        var rawItem = allData[itemIndex];
                        // 更新状态，但不触发事件
                        selectItem(control, rawItem.id, toBeSelected);
                    }
                });
            };

        /**
         *  下面的方法专属delete型table
         *
         */

        function actionForDelete(control, row, item) {
            deleteItem(control, item.id);
            // 外部需要知道什么数据被删除了
            control.fire('delete', { items: [item] });
        }

        /**
         * 删除选择的节点
         *
         * @param {ui.TableRichSelector} control 类实例
         * @param {number} id 结点数据id
         *
         * @ignore
         */
        function deleteItem(control, id) {
            // 完整数据
            var indexData = control.indexData;
            var index = indexData[id];

            var newData = [].slice.call(control.datasource, 0);
            newData.splice(index, 1);

            control.set('datasource', newData);
        }

        /**
         * 删除全部
         *
         * @FIXME 删除全部要区分搜索和非搜索状态么
         * @override
         */
        TableRichSelector.prototype.deleteAll = function () {
            var items = u.clone(this.datasource);
            this.set('datasource', []);
            this.fire('delete', { items: items });
        };


        function actionForLoad(control, row, item) {
            var selectedClasses = 
                control.helper.getPartClassName('row-selected');
            // 点击未选中的，执行
            if (!lib.hasClass(row, selectedClasses)) {
                selectItem(control, item.id, true);
                control.fire('load');
            }
        }


        /**
         * 搜索含有关键字的结果，默认以name为目标搜索
         * 
         * 可重写
         *
         * @param {String} keyword 关键字
         * @public
         */
        TableRichSelector.prototype.queryItem = function (keyword) {
            var queriedData = [];
            u.each(this.allData, function (data, index) {
                if (data.name.indexOf(keyword) !== -1) {
                    queriedData.push(data);
                }
            });
            this.queriedData = queriedData;
            // 更新状态
            this.addState('queried');
            this.refreshContent();
        };

        /**
         * 清空搜索的结果
         *
         */
        TableRichSelector.prototype.clearData = function () {
            // 清空数据
            this.queriedData = [];
        };

        /**
         * add(load)型：或许当前选择状态的数据
         * delete型：获取全部数据
         *
         * @return {Object}
         * @public
         */
        TableRichSelector.prototype.getSelectedItems = function () {
            var rawData = this.datasource;
            var allData = this.allData;
            var mode = this.mode;
            if (mode === 'delete') {
                return data;
            }
            var selectedData = u.filter(rawData, function (item, index) {
                return allData[index]['isSelected'];
            });
            return selectedData;
        };

        /**
         * 获取当前状态的显示个数
         *
         * @return {number}
         * @override
         */
        TableRichSelector.prototype.getCurrentStateItemsCount = function () {
            var data = this.isQuery() ? this.queriedData : this.allData;
            data = data || [];
            return data.length;
        };

        require('esui').register(TableRichSelector);

        return TableRichSelector;
    }
);

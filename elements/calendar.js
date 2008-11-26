/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

// #ifdef __JCALENDAR || __INC_ALL
/**
 * Element displaying a list of day numbers in a grid, ordered by week. It
 * allows the user to choose the month and year for which to display the days.
 * Calendar returns a date in chosen date format. Minimal size of calendar is
 * 150px.
 * 
 * Example:
 * Calendar component with date set on "Saint Nicholas Day" in iso date format
 * <code>
 *     <j:calendar top="200" left="400" date-format="yyyy-mm-dd" value="2008-12-05" />
 * </code>
 * 
 * @constructor
 * @addnode elements:calendar
 *
 * @attribute {String}   date-format   It's a style of displaying date,
 *                                     default is ddd mmm dd yyyy HH:MM:ss
 *     Possible values:
 *     ddd mmm dd yyyy HH:MM:ss        (Thu Nov 06 2008 14:27:46), It's a default date format
 *     m/d/yy                          (11/6/08), It's a short date format
 *     mmm d, yyyy                     (Nov 6, 2008), It's a medium date format
 *     mmmm d, yyyy                    (November 6, 2008), It's a long date format
 *     dddd, mmmm d, yyyy              (Thursday, November 6, 2008), It's a full date format
 *     h:MM TT                         (2:31 PM), It's a short time format
 *     h:MM:ss TT                      (2:32:23 PM), It's a medium time format
 *     h:MM:ss TT Z                    (2:35:06 PM GMT+01000), It's a long time format
 *     yyyy-mm-dd                      (2008-11-06), It's a iso date format
 *     HH:MM:ss                        (14:36:13), It's a iso time format
 * @attribute {String}   value         It's a date wrote in allowed format.
 *                                     If value propertie is set at begining,
 *                                     calendar will be showing this date, if
 *                                     not, current date.
 * 
 * @classDescription    This class creates a new calendar
 * @return {Calendar}   Returns a new calendar
 *
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 * 
 * @author      Lukasz Lipinski
 * @version     %I%, %G%
 * @since       1.0
 */
jpf.calendar = jpf.component(jpf.NODE_VISIBLE, function() {
    this.$animType        = 1;
    this.$animSteps       = 5;
    this.$animSpeed       = 20;
    this.$itemSelectEvent = "onmouseup";

    /**** Properties and Attributes ****/

    this.dragdrop      = false;
    this.reselectable  = true;
    this.$focussable   = true;
    this.autoselect    = false;
    this.multiselect   = false;
    this.disableremove = true;
    this.dateFormat    = "ddd mmm dd yyyy HH:MM:ss";
    this.value         = null;

    this.sliderHeight = 0;

    var _day          = null,
        _month        = null,
        _year         = null,
        _hours        = 1,
        _minutes      = 0,
        _seconds      = 0,
        _currentMonth = null,
        _currentYear  = null,
        _numberOfDays = null,
        _dayNumber    = null;
        
    var minWidth = 150;

    var days = ["Sunday", "Monday", "Tuesday", "Wednesday",
                "Thursday", "Friday", "Saturday"];
    var months = [{name : "January",   number : 31},
                  {name : "February",  number : 28},
                  {name : "March",     number : 31},
                  {name : "April",     number : 30},
                  {name : "May",       number : 31},
                  {name : "June",      number : 30},
                  {name : "July",      number : 31},
                  {name : "August",    number : 31},
                  {name : "September", number : 30},
                  {name : "October",   number : 31},
                  {name : "November",  number : 30},
                  {name : "December",  number : 31}];

    var _self = this;

    this.$booleanProperties["disableremove"] = true;

    this.$supportedProperties.push("disableremove", "initial-message",
        "value", "date-format", "width");

    this.$propHandlers["date-format"] = function(value) {
        this.setProperty("value", new Date().format(this.dateFormat = value));
    }

    this.$propHandlers["value"] = function(value) {
        this.oLabel.innerHTML = value;
        var date = Date.parse(value, this.dateFormat);
        //#ifdef __DEBUG
        if (!date) {
            throw new Error(jpf.formErrorString(this, "Parsing date",
                "Invalid date: " + value));
        }
        //#endif

        _day   = date.getDate();
        _month = date.getMonth();
        _year  = date.getFullYear();

        this.redraw(_month, _year);
    }

    /**** Public methods ****/

    this.setValue = function(value) {
        this.setProperty("value", value);
    };

    this.getValue = function() {
        return this.value;
    };

    /**
     * Toggles the visibility of the container with the calendar. It opens
     * or closes it using a slide effect.
     */
    this.slideToggle = function(e) {
        if (!e) e = event;

        if (this.isOpen)
            this.slideUp();
        else
            this.slideDown(e);
    };

    /**
     * Shows the container with the list elements using a slide effect.
     */
    this.slideDown = function(e) {
        if (this.dispatchEvent("slidedown") === false)
            return false;

        this.isOpen = true;

        this.oSlider.style.display = "block";
        this.oSlider.style[jpf.supportOverflowComponent
            ? "overflowY"
            : "overflow"] = "hidden";

        this.oSlider.style.display = "";
        this.$setStyleClass(this.oButton, "down");
        this.$setStyleClass(this.oFirst, "down");
        this.$setStyleClass(this.oLabel, "down");

        jpf.popup.show(this.uniqueId, {
            x        : 0,
            y        : this.oExt.offsetHeight,
            animate  : true,
            ref      : this.oExt,
            width    : this.oExt.offsetWidth + 1,
            height   : this.sliderHeight,
            callback : function(container) {
                container.style[jpf.supportOverflowComponent 
                    ? "overflowY"
                    : "overflow"] = "auto";
            }
        });
    };

    /**
     * Hides the container with the calendar using a slide effect.
     */
    this.slideUp = function() {
        if (this.isOpen == 2) return false;
        if (this.dispatchEvent("slideup") === false) return false;
        
        this.isOpen = false;
        if (this.selected) {
            var htmlNode = jpf.xmldb.findHTMLNode(this.selected, this);
            if (htmlNode) this.$setStyleClass(htmlNode, '', ["hover"]);
        }

        this.$setStyleClass(this.oButton, "", ["down"]);
        this.$setStyleClass(this.oFirst, "", ["down"]);
        this.$setStyleClass(this.oLabel, "", ["down"]);
        jpf.popup.hide();

        return false;
    };

    /**** Private methods and event handlers ****/

    this.$setLabel = function(value) {
        this.oLabel.innerHTML = value || this.initialMsg || "";
    };

    this.addEventListener("afterselect", function(e) {
        if (!e) e = event;
        
        this.slideUp();
    });

    this.addEventListener("afterdeselect", function() {
        this.$setLabel("");
    });

    function setMaxCount() {
        if (this.isOpen == 2)
            this.slideDown();
    }

    this.$blur = function() {
        this.slideUp();

        this.$setStyleClass(this.oLabel, "", ["focus"]);
        this.$setStyleClass(this.oButton, "", ["focus"]);
        this.$setStyleClass(this.oFirst, "", ["focus"]);
    };

    this.$focus = function() {
        jpf.popup.forceHide();
        this.$setStyleClass(this.oLabel, "focus");
        this.$setStyleClass(this.oButton, "focus");
        this.$setStyleClass(this.oFirst, "focus");
    }

    this.$setClearMessage = function(msg) {
        this.$setLabel("Please set date");
    };

    this.$removeClearMessage = function() {
        this.$setLabel("");
    };

    this.addEventListener("popuphide", this.slideUp);

    /**** Keyboard Support ****/

    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e) {
        e = e || event;

        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey;

        switch (key) {
            case 13: /* enter */
                this.selectDay(_day);
                this.slideUp();
                break;

            case 33: /* page up */
                this.nextMonth();
                break;

            case 34: /* page down */
                this.prevMonth();
                break;

            case 37: /* left arrow */
                if (ctrlKey)
                    this.prevMonth();
                else if (shiftKey)
                    this.prevYear();
                else {
                    if (_day - 1 < 1) {
                        this.prevMonth();
                        this.selectDay(months[_currentMonth].number);
                    }
                    else {
                        this.selectDay(_day - 1);
                    }
                }
                break;

            case 38: /* up arrow */
                if (ctrlKey)
                    this.slideUp();
                else {
                    if (_day - 7 < 1) {
                        this.prevMonth();
                        this.selectDay(months[_currentMonth].number + _day - 7);
                    }
                    else {
                        this.selectDay(_day - 7);
                    }
                }
                break;
 
            case 39: /* right arrow */
                if (ctrlKey)
                    this.nextMonth();
                else if (shiftKey)
                    this.nextYear();
                else
                    this.selectDay(_day + 1);
                break;

            case 40: /* down arrow */
                if (ctrlKey)
                    this.slideDown(e);
                else
                    this.selectDay(_day + 7);
                break;

            case 84:
                if (ctrlKey)
                    this.today();
                    return false;
                break;
        }
    }, true);
    //#endif

    var isLeapYear = function(year) {
        return ((year % 4 == 0) && (year % 100 !== 0)) || (year % 400 == 0)
            ? true
            : false;
    };

    this.redraw = function(month, year) {
        _currentMonth = month;
        _currentYear  = year;

        var w_firstYearDay = new Date(year, 0, 1);
        var w_dayInWeek    = w_firstYearDay.getDay();
        var w_days         = w_dayInWeek;

        for (i = 0; i <= month; i++) {
            if (isLeapYear(year) && i == 1)
                w_days++;
            w_days += months[i].number;
        }

        var w_weeks  = Math.ceil(w_days / 7);

        var date = new Date(year, month);

        _numberOfDays = months[date.getMonth()].number;
        if (isLeapYear(year) && date.getMonth() == 1) 
            _numberOfDays++;

        _dayNumber = new Date(year, month, 1).getDay();
        var prevMonth     = month == 0 ? 11 : month - 1;
        var prevMonthDays = months[prevMonth].number - _dayNumber + 1;

        var nextMonthDays = 1;

        var rows = this.oNavigation.childNodes;
        for (i = 0; i < rows.length; i++) {
            if ((rows[i].className || "").indexOf("today") != -1) {
                if (this.width < 300) {
                    rows[i].style.width = "10px";
                    rows[i].innerHTML = "T";
                }
                else {
                    rows[i].innerHTML = "Today";
                }
            }
            else if ((rows[i].className || "").indexOf("status") != -1) {
                if (this.width >= 300)
                    rows[i].innerHTML = months[_currentMonth].name
                                      + " " + _currentYear;
                else {
                    rows[i].innerHTML = (_currentMonth + 1) + "/" + _currentYear;
                    rows[i].style.width = "40px";
                    rows[i].style.marginLeft = "-20px";
                }
            }
        }

        this.sliderHeight = 24;//nav height
        var squareSize = Math.floor((this.width - 37)/8);

        var daysofweek = this.oDow.childNodes;
        this.oDow.style.width = (squareSize*8 + 32) + "px";
        this.oDow.style.height = (squareSize + 2) + "px";
        this.sliderHeight += (squareSize + 2);

        for (var z = 0, i = 0; i < daysofweek.length; i++) {
            if ((daysofweek[i].className || "").indexOf("dayofweek") > -1) {
                daysofweek[i].style.width = squareSize + "px";
                daysofweek[i].style.height = Math.floor((squareSize + 12)/2)
                                           + "px";
                daysofweek[i].style.paddingTop = Math.max(squareSize - 2 
                    - (Math.floor((squareSize + 12)/2)), 0) + "px";

                daysofweek[i].innerHTML = z == 0
                    ? "Week"
                    : days[z - 1].substr(0, 3);
                z++;
            }
        }

        rows = this.oSlider.childNodes;
        for (z = 0, y = 0, i = 0; i < rows.length; i++) {
            if ((rows[i].className || "").indexOf("row") == -1)
                continue;

            rows[i].style.width = (squareSize*8 + 32) + "px";
            rows[i].style.height = (squareSize + 4) + "px";
            this.sliderHeight += (squareSize + 4);

            cells = rows[i].childNodes;
            for (var j = 0; j < cells.length; j++) {
                if ((cells[j].className || "").indexOf("cell") == -1)
                    continue;
                z++;
                cells[j].style.width = squareSize + "px";
                cells[j].style.height = Math.floor((squareSize + 12)/2) + "px";
                cells[j].style.paddingTop = squareSize 
                                          - (Math.floor((squareSize + 12)/2))
                                          + "px";

                this.$setStyleClass(cells[j], "", ["weekend", "disabled",
                    "active", "prev", "next"]);

                if ((z - 1) % 8 == 0) {
                    cells[j].innerHTML = w_weeks
                        - Math.ceil((months[_month].number + _dayNumber) / 7)
                        + 1 + (z - 1) / 8;
                }
                else {
                    y++;
                    if (y <= _dayNumber) {
                        cells[j].innerHTML = prevMonthDays++;
                        this.$setStyleClass(cells[j], "disabled prev");
                    }
                    else if (y > _dayNumber && y <= _numberOfDays + _dayNumber) {
                        cells[j].innerHTML = y - _dayNumber;

                        var dayNrWeek = new Date(year, month,
                                                 y - _dayNumber).getDay();

                        if (dayNrWeek == 0 || dayNrWeek == 6) {
                            this.$setStyleClass(cells[j], "weekend");
                        }

                        if (month == _month
                            && year == _year
                            && y - _dayNumber == _day)
                            this.$setStyleClass(cells[j], "active");

                    }
                    else if (y > _numberOfDays + _dayNumber) {
                        cells[j].innerHTML = nextMonthDays++;
                        this.$setStyleClass(cells[j], "disabled next");
                    }
                }
            }
        }
    };

    /**
     * Change choosen date with selected and highlight its cell in calendar
     * component
     * 
     * @param {Number}   nr     day number
     * @param {String}   type   class name of html representation of selected cell
     */
    this.selectDay = function(nr, type) {
        var newMonth = type == "prev"
            ? _currentMonth
            : (type == "next"
                ? _currentMonth + 2
                : _currentMonth + 1);

        var newYear = _currentYear;

        if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }
        else if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        }

        this.change(new Date(newYear, (newMonth - 1), nr, _hours, _minutes,
            _seconds).format(this.dateFormat));
    };

    /**
     * Change displayed year to next
     */
    this.nextYear = function() {
        this.redraw(_currentMonth, _currentYear + 1);
    };

    /**
     * Change displayed year to previous
     */
    this.prevYear = function() {
        this.redraw(_currentMonth, _currentYear - 1);
    };

    /**
     * Change displayed month to next. If actual month is December, function
     * change current displayed year to next
     */
    this.nextMonth = function() {
        var newMonth, newYear;
        if (_currentMonth > 10) {
            newMonth = 0;
            newYear  = _currentYear + 1;
        }
        else {
            newMonth = _currentMonth + 1;
            newYear  = _currentYear;
        }

        this.redraw(newMonth, newYear);
    };

    /**
     * Change displayed month to previous. If actual month is January, function
     * change current displayed year to previous
     */
    this.prevMonth = function() {
        var newMonth, newYear;
        if (_currentMonth < 1) {
            newMonth = 11;
            newYear  = _currentYear - 1;
        }
        else {
            newMonth = _currentMonth - 1;
            newYear  = _currentYear;
        }

        this.redraw(newMonth, newYear);
    };

    /**
     * Select today's date on calendar component
     */
    this.today = function() {
        this.setProperty("value", new Date().format(this.dateFormat));
    };

    /**** Init ****/

    this.$draw = function() {
        this.$animType = this.$getOption("main", "animtype") || 1;
        this.clickOpen = this.$getOption("main", "clickopen") || "button";

        //Build Main Skin
        this.oExt = this.$getExternal("main", null, function(oExt) {
            var oButton = this.$getLayoutNode("main", "button", this.oExt);
            oButton.setAttribute("onmousedown", 'var o = jpf.lookup('
                    + this.uniqueId + '); o.slideToggle(event);');

            var oFirst = this.$getLayoutNode("main", "first", this.oExt);
            oFirst.setAttribute("onmousedown", 'var o = jpf.lookup('
                    + this.uniqueId + '); o.slideToggle(event);');

            var oLabel = this.$getLayoutNode("main", "label", this.oExt);
            oLabel.setAttribute("onmousedown", 'var o = jpf.lookup('
                    + this.uniqueId + '); o.slideToggle(event);');
        });
        
        this.oSlider = this.$getExternal("container", null, function(oExt1) {
            var oSlider = this.$getLayoutNode("container", "contents", oExt1);

            for (var i = 0; i < 6; i++) {
                this.$getNewContext("row");
                var oRow = oSlider.appendChild(this.$getLayoutNode("row"));

                for (var j = 0; j < 8; j++) {
                    this.$getNewContext("cell");
                    var oCell = this.$getLayoutNode("cell");
                    if (j > 0) {
                        oCell.setAttribute("onmouseover",
                            "if (this.className.indexOf('disabled') > -1) "
                            + "return; jpf.lookup(" + this.uniqueId 
                            + ").$setStyleClass(this, 'hover');");
                        oCell.setAttribute("onmouseout", 
                            "var o = jpf.lookup(" + this.uniqueId 
                            + ").$setStyleClass(this, '', ['hover']);");
                        oCell.setAttribute("onmousedown", 
                            "var o = jpf.lookup(" + this.uniqueId + ");"
                            + " if (this.className.indexOf('prev') > -1) { "
                            + "o.selectDay(this.innerHTML, 'prev');}"
                            + " else if (this.className.indexOf('next') > -1) {"
                            + "o.selectDay(this.innerHTML, 'next');}"
                            + " else {o.selectDay(this.innerHTML);}o.slideUp();");
                    }
                    oRow.appendChild(oCell);
                }
            }
            
            var oNavigation = this.$getLayoutNode("container", "navigation",
                                                  oExt1);

            if (oNavigation) {
                var buttons = ["prevYear", "prevMonth", "nextYear", "nextMonth",
                               "today", "status"];
                for (var i = 0; i < buttons.length; i++) {
                    this.$getNewContext("button");
                    var btn = oNavigation.appendChild(this.$getLayoutNode("button"));
                    this.$setStyleClass(btn, buttons[i]);
                    if (buttons[i] !== "status")
                        btn.setAttribute("onmousedown", 'jpf.lookup('
                                         + this.uniqueId + ').'
                                         + buttons[i] + '()');
                }
            }

            var oDaysOfWeek = this.$getLayoutNode("container",
                                                  "daysofweek", oExt1);

            for (var i = 0; i < days.length + 1; i++) {
                this.$getNewContext("day");
                oDaysOfWeek.appendChild(this.$getLayoutNode("day"));
            }
        });

        this.oLabel  = this.$getLayoutNode("main", "label", this.oExt);
        this.oButton = this.$getLayoutNode("main", "button", this.oExt);
        this.oFirst  = this.$getLayoutNode("main", "first", this.oExt);

        this.oNavigation = this.$getLayoutNode("container",
                                               "navigation",  this.oSlider);
        this.oDow        = this.$getLayoutNode("container",
                                               "daysofweek",  this.oSlider);

        var daysofweek = this.oDow.childNodes;
        for (var z = 0, i = 0; i < daysofweek.length; i++) {
            if ((daysofweek[i].className || "").indexOf("dayofweek") > -1) {
                daysofweek[i].innerHTML = z == 0 
                    ? "Week"
                    : days[z - 1].substr(0, 3);
                z++;
            }
        }

        this.pHtmlDoc = jpf.popup.setContent(this.uniqueId, this.oSlider,
            jpf.skins.getCssString(this.skinName));
    };

    this.$loadJml = function(x) {
        if (!this.selected && this.initialMsg)
            this.$setLabel();
            
        if (!x.getAttribute("date-format") && !x.getAttribute("value")) {
            this.setProperty("value", new Date().format(this.dateFormat));
        }
        
        if (x.getAttribute("width")) {
            var width = parseInt(x.getAttribute("width"));
            this.width = width >= minWidth ? width : minWidth;
        }

        var size = parseInt(this.width) - this.oButton.offsetWidth
                 - this.oFirst.offsetWidth
                 - jpf.getDiff(this.oLabel)[0];
        this.oSlider.style.width = this.width + "px";
        this.oLabel.style.width = (size > 0 ? size : 1) + "px";
        this.oNavigation.style.width = (Math.floor((this.width - 36)/8)*8 + 32
            - jpf.getDiff(this.oNavigation)[0]) + "px";
    };
    
    this.$destroy = function() {
        jpf.popup.removeContent(this.uniqueId);
        jpf.removeNode(this.oSlider);
        this.oSlider = null;
    };
}).implement(
    jpf.Presentation, 
    jpf.DataBinding
);

// #endif

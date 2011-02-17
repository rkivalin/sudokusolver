
function array(dim, value, level) {
    var i, arr = [];
    if (level === void 0) { level = 0; } else level = ~~level;
    if (typeof (dim) === 'number') for (i = 0; i < dim; i++) { arr[i] = value; }
    else if (dim.length === 1+level) for (i = 0; i < dim[level]; i++) { arr[i] = value; }
    else for (i = 0; i < dim[level]; i++) { arr[i] = array(dim, value, level + 1); }
    return arr;
}

function array_del(arr, index) {
    if (+index >= arr.length) return;
    for (var i = +index + 1; i < arr.length; i++)
        arr[i - 1] = arr[i];
    arr.pop();
}

function array_del_value(arr, value) {
    for (var i = 0; i < arr.length; i++)
        if (arr[i] == value)
            array_del(arr, i--);
}

function str_pad(input, pad_length, pad_string, pad_type) {   // Pad a string to a certain length with another string
    //
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // + namespaced by: Michael White (http://crestidg.com)

    var half = '', pad_to_go;

    var str_pad_repeater = function(s, len) {
            var collect = '', i;

            while(collect.length < len) collect += s;
            collect = collect.substr(0,len);

            return collect;
        };

    if (pad_type != 'STR_PAD_LEFT' && pad_type != 'STR_PAD_RIGHT' && pad_type != 'STR_PAD_BOTH')
        pad_type = 'STR_PAD_RIGHT';
    if ((pad_to_go = pad_length - input.length) > 0) {
        if (pad_type == 'STR_PAD_LEFT') { input = str_pad_repeater(pad_string, pad_to_go) + input; }
        else if (pad_type == 'STR_PAD_RIGHT') { input = input + str_pad_repeater(pad_string, pad_to_go); }
        else if (pad_type == 'STR_PAD_BOTH') {
            half = str_pad_repeater(pad_string, Math.ceil(pad_to_go/2));
            input = half + input + half;
            input = input.substr(0, pad_length);
        }
    }

    return input;
}

function str_repeat(str, mul) {
    for (var i = 0, ret = ''; i < mul; i++) ret += str;
    return ret;
}

function json_dump(v, limit) {
    switch (typeof v) {
      case "boolean": case "number": return v;
      case "string": return '"' + v + '"';
      case "object":
        if (limit === 0) return "obj";
        if (v == null) return 'null';
        if (v instanceof Array) {
            var map = [], i;
            for (i = 0; i < v.length; i++)
                map.push(json_dump(v[i], limit - 1));
            return "[" + map.join(",") + "]";
        }
        var props = [];
        for (var prop in v) // if (v.hasOwnProperty(prop))
            try { props.push(prop + ':' + json_dump(v[prop], limit - 1)); }
            catch (e) { props.push(prop); };
        return "{" + props.join(",") + "}";
    }
}

function is_integer() {
    for (var i = 0; i < arguments.length; i++)
        if (typeof arguments[i] !== 'number' || Math.ceil(arguments[i]) !== arguments[i]) {
        return false;
    }
    return true;
}

function sudoku(rootnode) {
    if (rootnode === void 0) {
        rootnode = $();
    }

    this.rootnode = rootnode;
    this.timers = {selector: false, update: false, recsolver: false};

    this.sources = {user: true, solver: true, gnc: true};

    this.state = -1;
    this.svg = false;
    this.rendered = false;
    this.gr = [];
    this.interactive = true; // gui allows to interact
    this.autovalidate = true; // automatic validation
    this.autosolve = true; // automatic solving
    this.g = {
        /// manual
        cell_h: 30, cell_w: 30, // cell size
        sel_h: 20, sel_w: 20, // selector cell size
        padding: 5.5, // padding inside canvas
        /// automatic
        canv_w: 0, canv_h: 0, // canvas size
        sel_nh: 0, sel_nw: 0, // selector number of cell
        sel_th: 0, sel_tw: 0 // selector size
    };

    this.loglines = [];
    this.m = []; // game map

    this.h = 0; // box height
    this.w = 0; // box width
    this.s = 0; // sudoku size — this.h * this.w
    this.total = 0; // total number of cells
    this.filled = 0; // number of filled cells
    this.ufilled = 0; // number of filled by user cells
    this.boxes = false; // is boxes are used (there are no boxes if this.h or this.w is 1)
    this.mx = 0; // main grid height
    this.my = 0; // main grid width
    this.houses = {}; // list of houses
    this.sym = []; // sudoku symbols
    this.symtxt = false;
    this.grids = []; // coordinates of grids
    this.letters = 1; // maximum number of letters used in sudoku symbols

    this.update_w = {};
    this.on_update = [];
    this.on_load = [];
    this.on_select_grid = [];
    this.on_gnc_state = [];
    this.aftersolve = [];
    this.gnc = false;
    this.gnc_speed = 100;
}

sudoku.prototype.bind = function (type, f) {
    if (this.hasOwnProperty('on_' + type)) {
        this['on_' + type].push(f);
    } else {
        /* TODO: error handling */
    }
    return this;
}
sudoku.prototype.unbind = function (type, f) {
    if (f === void 0) {
        this['on' + type] = [];
    } else {
        array_del_value(this['on' + type], f);
    }
    return this;
}
sudoku.prototype.toggle = function (type) {
    if (this.hasOwnProperty('on_' + type)) {
        for (var i = 0; i < this['on_' + type].length; i++) {
            this['on_' + type][i](this);
        }
    } else {
        /* TODO: error handling */
    }
    return this;
}

sudoku.prototype.export_all = function () {
    var e = {map: "", data: "", solution: ""}, c = false;
    if (this.h !== 3 || this.w !== 3) {
        e.map += this.h + "x" + this.w + ",";
        c = true;
    }
    if (this.grids.length !== 1) {
        for (var i = 0; i < this.grids.length; i++) {
            e.map += this.grids[i].pos.x + ";" + this.grids[i].pos.y + ",";
            c = true;
        }
    }
    for (var p in this.houses) switch (this.houses[p].type) {
        case 3: e.map += "h=3;" + this.houses[p].grid + ","; break;
        case 4: e.map += "h=4;" + this.houses[p].grid + ","; break;
    }
    if (this.symtxt !== false) {
        e.map += "sym=" + this.symtxt + ",";
    }

    for (var y = 0, cell, num1 = 0, num2 = 0; y < this.my; y++) for (var x = 0; x < this.mx; x++) if (cell = this.m[x][y]) {
        if (cell.digit && cell.source === 'user') {
            e.data += str_repeat('.', num1) + str_pad(this.sym[cell.digit], this.letters, "_", 'STR_PAD_LEFT');
            num1 = 0;
        } else {
            num1++;
        }
        if (cell.digit) {
            e.solution += str_repeat('.', num2) + str_pad(this.sym[cell.digit], this.letters, "_", 'STR_PAD_LEFT');
            num2 = 0;
        } else {
            num2++;
        }
    }
    return e;
}

sudoku.prototype.import_txt = function (data) {
    if (typeof data !== "string") {
        return false;
    }
    data = data.split(/\,/);
    var map = {h: 3, w: 3, grids: [], houses: []}, i = 0, t, vars = {l: 1};
    if (i < data.length && data[i].match(/^\d+x\d+$/)) {
        t = data[i].split(/x/);
        map.h = +t[0];
        map.w = +t[1];
        i++;
    }
    while (i < data.length && data[i].match(/^\d+;\d+$/)) {
        t = data[i].split(/;/);
        map.grids.push([+t[0], +t[1]]);
        i++;
    }
    if (!map.grids.length) {
        map.grids.push([0, 0]);
    }
    while (i < data.length) {
        if (data[i].match(/^h=\d+;\d+$/)) {
            t = (data[i].split(/=/))[1].split(/;/);
            if (+t[0] === 3 || +t[0] === 4) {
                map.houses.push({type: +t[0], grid: +t[1]});
            }
            i++;
        } else {
            break;
        }
    }
    while (i < data.length && data[i].match(/^\w+=.+$/)) {
        t = data[i].split(/=/);
        vars[t[0]] = t[1];
        i++;
    }
    if ("sym" in vars) {
        map.sym = vars.sym;
    }
    if (i === data.length - 1 && data[i].match(/^[\._0-9A-Z]*$/)) {
        map.data = data[i];
    }
    return this.load_map(map);
}

sudoku.prototype.cell_click = function (el, e, cell) {
    if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) {
        return;
    }
    if (cell.digit && cell.source !== 'user') {
        this.select_user(cell);
    } else if (cell.digit) {
        this.cancel(cell, 'user');
    } else {
        if (this.timers.selector) {
            clearTimeout(this.timers.selector);
            this.timers.selector = false;
        }
        var nx, ny, node;
        for (var k = 0; k < this.s; k++) {
            if (cell.cand[1 + k] || cell.mask[1 + k]) {
                $(this.gr.selector.childNodes[k]).addClass("disabled");
            } else {
                $(this.gr.selector.childNodes[k]).removeClass("disabled");
            }
        }
        this.acell = cell;
        nx = cell.g.x + this.g.cell_w / 2 - this.g.sel_tw * 0.5;
        ny = cell.g.y + this.g.cell_h / 2 - this.g.sel_th * 0.5;
        if (nx + this.g.sel_tw > this.g.canv_w) {
            nx = this.g.canv_w - this.g.sel_tw;
        }
        if (ny + this.g.sel_th > this.g.canv_h) {
            ny = this.g.canv_h - this.g.sel_th;
        }
        if (nx < 0) {
            nx = 0;
        }
        if (ny < 0) {
            ny = 0;
        }
        $(this.gr.selector).attr("transform", "translate("+nx+","+ny+")").show();
    }
}

sudoku.prototype.cell_click_f = function (ii, jj) {
    var i = ii, j = jj, t = this;
    return function (e) { t.cell_click(this, e, t.m[i][j]); };
}

sudoku.prototype.selector_click = function (el, e, k) {
    if (!e.shiftKey && (this.acell.cand[k] || this.acell.mask[k])) return;
    this.selector_hide(true);
    this.select(this.acell, k, 'user', e.shiftKey);
}

sudoku.prototype.selector_click_f = function (kk) {
    var k = kk, t = this;
    return function (e) { t.selector_click(this, e, k); }
}

sudoku.prototype.unload = function () {
    if (this.gnc) this.gnc_stop();
    this.aftersolve = [];
    for (var i in this.timers) if (this.timers[i]) {
        clearTimeout(this.timers[i]);
        this.timers[i] = false;
    }
    this.solving = false;
    this.rootnode.svg('destroy');
    this.svg = false;
    this.rendered = false;
    this.state = -1;
    this.m = [];
    this.grids = [];
    this.houses = {};
}

sudoku.prototype.load_sym = function (s) {
    this.symtxt = false;
    if (typeof s === "string" && s.length && s.length % this.s === 0) {
        this.symtxt = s;
        var n = s.length / this.s;
        this.sym = [''];
        for (var i = 0; i < this.s; i++) {
            this.sym.push(s.substr(i * n, n));
        }
    } else if (this.s < 16) {
        this.sym = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
    } else {
        this.sym = ['', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        for (var i = 0; i < this.s - 10; i++) {
            this.sym.push(aa(i));
        }
    }
    this.letters = this.sym[this.sym.length - 1].length;
    if (this.rendered) {
        for (var j = 0, cell; j < this.my; j++) for (var i = 0; i < this.mx; i++) if ((cell = this.m[i][j]) && cell.digit) {
            $("text", cell.g.node).text(this.sym[cell.digit]);
        }
        if (this.interactive) {
            for (var i = 0; i < this.s; i++) {
                $("text", this.gr.selector.childNodes[i]).text(this.sym[1 + i]);
            }
        }
    }
    this.upd('state');
}

sudoku.prototype.load_map = function (map) {
    if (this.gnc) {
        this.gnc_stop();
    }
    this.aftersolve = [];
    for (var i in this.timers) if (this.timers[i]) {
        clearTimeout(this.timers[i]);
        this.timers[i] = false;
    }
    this.solving = false;
    if (typeof map !== "object") {
        map = {};
    }
    this.state = 0;
    this.rendered = false;
    this.w = Math.floor(+map.w);
    this.h = Math.floor(+map.h);
    if (!(1 <= this.w && this.w <= 100000 && 1 <= this.h && this.h <= 100000)) {
        this.w = 3;
        this.h = 3;
    }
    if (this.h === 1) {
        this.h = this.w;
        this.w = 1;
    }
    this.boxes = this.w !== 1;
    this.s = this.w * this.h;
    this.load_sym(map.sym);
    this.mx = 0;
    this.my = 0;
    var vgrids = [];
    try {
        for (var z = 0; z < map.grids.length; z++) {
            var x = Math.floor(+map.grids[z][0]),
                y = Math.floor(+map.grids[z][1]);
            if (!(0 <= x && x <= 100000 && 0 <= y && y <= 100000)) {
                continue;
            }
            if (this.boxes && (x % this.h || y % this.w)) {
                continue;
            }
            vgrids.push([x, y]);
            if (x + this.s > this.mx) {
                this.mx = x + this.s;
            }
            if (y + this.s > this.my) {
                this.my = y + this.s;
            }
        }
    } catch (e) {};
    if (vgrids.length == 0) {
        vgrids.push([0, 0]);
        this.mx = this.my = this.s;
    }
    this.m = array([this.mx, this.my]);
    this.filled = 0;
    this.ufilled = 0;
    this.total = 0;
    this.grids = [];
    this.houses = {};
    for (var z = 0; z < vgrids.length; z++) {
        // filling map
        var x = vgrids[z][0], y = vgrids[z][1], grid = {};
        grid.id = this.grids.push(grid) - 1;
        for (var i = x; i < x + this.s; i++) for (var j = y; j < y + this.s; j++) {
            if (this.m[i][j]) {
                this.m[i][j].grids.push(grid);
                continue;
            }
            this.m[i][j] = {
                digit: 0, // placed digit (1..size, 0 - empty cell);
                source: '',
                houses: [], // list of houses;
                cand: array([1 + this.s], 0), // candidates (0 - is candidate);
                rcand: [], // digits that can be set into this cell (updates with .solve())
                mask: array([1 + this.s], 0), // mask (non zero - masked);
                solver: {ns: {}}, // ns - naked subset - is cell is a part of a naked subset;
                status: 0, // cell status;
                x: i, y: j,
                grids: [grid],
                svg: false
            };
            this.total++;
        }
        grid.pos = this.m[x][y];

        // houses
        for (var i = 0; i < this.s; i++) {
            this.addhouse(0, grid, i); // columns
            this.addhouse(1, grid, i); // rows
            this.addhouse(2, grid, i); // boxes
        }
    }
    for (var i = 0; i < this.mx; i++) for (var j = 0; j < this.my; j++) if (this.m[i][j]) {
        this.acell = this.m[i][j];
        i = this.mx;
        break;
    }
    this.agrid = this.grids[0];

    if (map.houses) try {
        for (var i = 0; i < map.houses.length; i++) {
            switch (map.houses[i].type) {
              case 3:
                if (!this.grids[map.houses[i].grid]) break;
                this.addhouse(3, this.grids[map.houses[i].grid]);
                break;
              case 4:
                if (!this.grids[map.houses[i].grid]) break;
                this.addhouse(4, this.grids[map.houses[i].grid]);
                break;
            }
        }
    } catch (e) {};

    if (map.data) try {
        for (var i = 0, p = 0; i < map.data.length; i++, p++)
            if (map.data.substr(i, 1) != '.') {
            var place = map.data.substr(i, this.letters);
            for (var j = 1; j < this.sym.length; j++) if (this.sym[j] == place) break;
            if (j == this.sym.length) continue;
            this.select(this.getcellbynumber(p), j, 'user', true);
            i += this.letters - 1;
        }
    } catch (e) {};

    if (this.svg) this.render();
    else if (this.rootnode.length) {
        var t = this;
        this.rootnode.svg({onLoad: function (svg) { t.svg = svg; t.render(); }});
    }

    this.solvelogclear();
    this.upd('state', 'solve');

    this.toggle('load');
}

sudoku.prototype.pos = function (x, y) {
    if (y == void 0) { y = x.y; x = x.x; }
    return {
        x: this.g.padding + this.g.cell_w * (x + 1),
        y: this.g.padding + this.g.cell_h * (y + 1)
    };
}

sudoku.prototype.center = function (x, y) {
    if (y == void 0) { y = x.y; x = x.x; }
    return {
        x: this.g.padding + this.g.cell_w * (x + 1.5),
        y: this.g.padding + this.g.cell_h * (y + 1.5)
    };
}

sudoku.prototype.render = function () {
    var stime = (new Date()).getTime();
    var t = this, svg = this.svg, g = this.g, m = this.m;
    g.canv_w = (this.mx+1)*g.cell_w + 2*g.padding;
    g.canv_h = (this.my+1)*g.cell_h + 2*g.padding;
    g.tx = g.cell_w / 2;
    g.ty = g.cell_h / 2 + 7;
    svg.clear(true);
    svg.configure({width: g.canv_w, height: g.canv_h}, true);
    svg.style("\
#cells rect { fill: #fff; stroke: #000; stroke-width: 0.2; }\
#cells g.error-1 rect, #cells g.error-2 rect { fill: #f45252; }\
#cells text { fill: #666; cursor: default; text-anchor: middle; }\
#cells text.user { fill: #000; }\
#cells text.solver { fill: #e00; }\
#cells text.gnc { fill: #080; }\
\
#selector { opacity: 0.7; }\
#selector:hover { opacity: 0.9; }\
#selector rect { fill: #fff; stroke: #000; stroke-width: 0.2; stroke-linecap: round; }\
#selector g:hover rect { fill: #f3f3f3; }\
#selector text { fill: #000; font-size: 12px; text-anchor: middle; cursor: default; }\
#selector g.disabled rect { fill: #fff; }\
#selector g.disabled text { fill: #ccc; }\
\
#grid_id { opacity: 0.9; fill: #000; stroke: #fff; stroke-width: 2; text-anchor: middle; cursor: default; }\
#grid_id text.active { fill: #e00; }\
#grid_id text:hover { stroke: #66e; }");
    var svgdefs = svg.defs();
    var d = svg.group(svgdefs, {id: "diag1", fill: "#ccc"});
    svg.circle(d, 0.2*g.cell_w, 0.2*g.cell_h, 0.1*g.cell_w);
    svg.circle(d, 0.5*g.cell_w, 0.5*g.cell_h, 0.1*g.cell_w);
    svg.circle(d, 0.8*g.cell_w, 0.8*g.cell_h, 0.1*g.cell_w);
    d = svg.group(svgdefs, {id: "diag2", fill: "#ccc"});
    svg.circle(d, 0.8*g.cell_w, 0.2*g.cell_h, 0.1*g.cell_w);
    svg.circle(d, 0.5*g.cell_w, 0.5*g.cell_h, 0.1*g.cell_w);
    svg.circle(d, 0.2*g.cell_w, 0.8*g.cell_h, 0.1*g.cell_w);
    var gr = this.gr = {};
    gr.coords = svg.group({
        fill: "#888",
        "font-size": 0.33*g.cell_h + "px",
        cursor: "default",
        "text-anchor": "middle"});
    for (var i = 0; i < this.mx; i++)
        svg.text(gr.coords, this.center(i, 0).x, g.padding + g.cell_h / 2 + 8, ""+(i+1));
    for (var i = 0; i < this.my; i++)
        svg.text(gr.coords, g.padding + g.cell_w / 2 + 5, this.center(0, i).y + 5, aa(i));
    gr.cells = svg.group({id: "cells", "font-size": 0.7*g.cell_h + "px"});
    for (var j = 0, cell; j < this.my; j++) for (var i = 0; i < this.mx; i++) if (cell = m[i][j]) {
        var p = this.pos(cell);
        cell.g = {};
        cell.g.node = svg.group(gr.cells);
        cell.g.x = p.x;
        cell.g.y = p.y;
        svg.rect(cell.g.node, p.x, p.y, g.cell_w, g.cell_h);
        if (this.interactive) {
            $(cell.g.node).bind('click', this.cell_click_f(i, j));
        }
        if (cell.status) {
            $(cell.g.node).addClass("error-" + cell.status);
        }
        for (var z = 0; z < cell.houses.length; z++) {
            if (cell.houses[z].type === 3) {
                svg.use(cell.g.node, "#diag1", {transform: "translate(" + p.x + ", " + p.y + ")", class_: "diag1"});
            } else if (cell.houses[z].type === 4) {
                svg.use(cell.g.node, "#diag2", {transform: "translate(" + p.x + ", " + p.y + ")", class_: "diag2"});
            }
        }
        if (cell.digit) {
            svg.text(cell.g.node,
                cell.g.x + g.tx,
                cell.g.y + g.ty,
                this.sym[cell.digit],
                {class_: cell.source});
        }
    }

    gr.hborder = svg.group({
        stroke: "#888",
        "stroke-width": "2.5",
        "stroke-linecap": "round"});
    gr.mborder = svg.group({
        stroke: "#000",
        "stroke-width": "2.5",
        "stroke-linecap": "round"});
    for (var j = 0, cell; j < this.my; j++) for (var i = 0; i < this.mx; i++) if (cell = m[i][j]) {
        var p = {x: cell.g.x, y: cell.g.y},
            q = this.pos(i+1, j+1);
        if (this.boxes) {
            for (var z1 = 0; z1 < cell.houses.length; z1++) if (cell.houses[z1].type == 2) break;
            if (i != 0 && this.m[i - 1][j]) { // left
                for (var z2 = 0; z2 < m[i - 1][j].houses.length; z2++)
                    if (m[i - 1][j].houses[z2].type == 2) break;
                if (cell.houses[z1].id != m[i - 1][j].houses[z2].id)
                    svg.path(gr.hborder, "M"+p.x+","+p.y+"L"+p.x+","+q.y);
            }
            if (j != 0 && m[i][j - 1]) { // top
                for (var z2 = 0; z2 < m[i][j - 1].houses.length; z2++)
                    if (m[i][j - 1].houses[z2].type == 2) break;
                if (cell.houses[z1].id != m[i][j - 1].houses[z2].id)
                    svg.path(gr.hborder, "M"+p.x+","+p.y+"L"+q.x+","+p.y);
            }
        }
        if (j == 0 || !m[i][j - 1]) {
            svg.path(gr.mborder, "M"+p.x+","+p.y+"L"+q.x+","+p.y);
        }
        if (i == 0 || !m[i - 1][j])
            svg.path(gr.mborder, "M"+p.x+","+p.y+"L"+p.x+","+q.y);
        if (i == this.mx - 1 || !m[i + 1][j])
            svg.path(gr.mborder, "M"+q.x+","+p.y+"L"+q.x+","+q.y);
        if (j == this.my - 1 || !m[i][j + 1])
            svg.path(gr.mborder, "M"+p.x+","+q.y+"L"+q.x+","+q.y);
    }

    gr.grid_id = svg.group({id: "grid_id", "font-size": 0.8*this.s*g.cell_h + "px"});
    for (var z = 0; z < this.grids.length; z++) {
        var x = this.grids[z].pos.g.x + 0.5*this.s*g.cell_w,
            y = this.grids[z].pos.g.y + 0.7*this.s*g.cell_h,
            options = {};
        if (this.grids[z] == this.agrid) options = {class_: 'active'};
        this.grids[z].id_node = svg.text(gr.grid_id, x, y, "" + (z + 1), options);
    }
    $("text", gr.grid_id).click(function () { t.select_grid(this.textContent - 1); });
    $(gr.grid_id).hide();

    if (this.interactive) {
        var n, cf;
        gr.selector = svg.group({id: "selector"});
        g.sel_nw = Math.ceil(Math.sqrt(this.s));
        g.sel_nh = Math.floor(Math.sqrt(this.s));
        g.sel_tw = g.sel_nw * g.sel_w;
        g.sel_th = g.sel_nh * g.sel_h;
        for (var j = 0, k = 1; j < g.sel_nh; j++) for (var i = 0; i < g.sel_nw; i++, k++) {
            cf = this.selector_click_f(k);
            n = svg.group(gr.selector);
            svg.rect(n, i * g.sel_w, j * g.sel_h, g.sel_w, g.sel_h);
            if (k > this.s) {
                continue;
            }
            svg.text(n, g.sel_w * (i + 0.5), g.sel_h * (j + 0.7), this.sym[k]);
            $(n).bind('click', this.selector_click_f(k));
        }
        svg.path(gr.selector, "M0,0L0," + g.sel_th + "L" + g.sel_tw + "," +
            g.sel_th + "L" + g.sel_tw + ",0L0,0",
            {fill: "none", stroke: "#888", "stroke-width": "1.5"});
        $(gr.selector).bind('mouseover', function () {
            if (t.timers.selector) {
                clearTimeout(t.timers.selector);
                t.timers.selector = false;
            }
        }).bind('mouseout', function () { t.selector_hide(); }).hide();
    }

    this.rendered = true;

    if (window.console) console.log("rendered in: " + ((new Date()).getTime() - stime));
}

sudoku.prototype.show_grid_id = function () { $(this.gr.grid_id).show(); }
sudoku.prototype.hide_grid_id = function () { $(this.gr.grid_id).hide(); }

sudoku.prototype.select_grid = function (grid) {
    if (this.rendered && this.agrid) $(this.agrid.id_node).removeClass("active");
    this.agrid = false;
    if (typeof grid == "number" || typeof grid == "string")
        if (this.grids[+grid]) this.agrid = this.grids[+grid];
    else if (typeof grid == "object" && grid.hasOwnProperty('id'))
        if (this.grids[+grid.id]) this.agrid = this.grids[+grid.id];
    if (this.rendered) $(this.agrid.id_node).addClass("active");
    this.toggle('select_grid');
    return this;
}

// .addhouse(type, grid, q);
sudoku.prototype.addhouse = function (type, grid, q) {
    if (this.state === -1) {
        throw {errmsg: "Cannot use addhouse while state = -1"};
    }
    var i, j, c;
    var house = {type: +type, filled: 0, ns: 0};
    switch (house.type) {
      case 0: // it's a column
        /* TODO: validate grid, q */
        house.id = coord(this.m[grid.pos.x][grid.pos.y + q]);
        house.s = "_0_" + house.id;
        if (this.houses[house.s]) {
            return false;
        }
        for (i = 0; i < this.s; i++) {
            house[i] = this.m[grid.pos.x + i][grid.pos.y + q];
        }
        break;
      case 1: // it's a row
        /* TODO: validate grid, q */
        house.id = coord(this.m[grid.pos.x + q][grid.pos.y]);
        house.s = "_1_" + house.id;
        if (this.houses[house.s]) {
            return false;
        }
        for (i = 0; i < this.s; i++) {
            house[i] = this.m[grid.pos.x + q][grid.pos.y + i];
        }
        break;
      case 2: // it's a box
        /* TODO: validate grid, q */
        if (!this.boxes) {
            return false;
        }
        var x = grid.pos.x + (q % this.h) * this.w,
            y = grid.pos.y + Math.floor(q / this.h) * this.h;
        house.id = coord(this.m[x][y]);
        house.s = "_2_" + house.id;
        if (this.houses[house.s]) {
            return false;
        }
        for (i = 0; i < this.w; i++) for (j = 0; j < this.h; j++) {
            house[i * this.h + j] = this.m[x + i][y + j];
        }
        break;
      case 3: // it's a main diagonal
        /* TODO: validate grid */
        house.id = coord(grid.pos);
        house.s = "_3_" + house.id;
        if (this.houses[house.s]) {
            return false;
        }
        house.grid = grid.id;
        m: for (i = 0; i < this.s; i++) {
            house[i] = this.m[grid.pos.x + i][grid.pos.y + i];
            for (j = 0; j < house[i].houses.length; j++) if (house[i].houses[j].type === house.type) {
                continue m;
            }
            if (this.rendered) {
                this.svg.use(house[i].g.node, "#diag1",
                    {transform: "translate(" + house[i].g.x + ", " + house[i].g.y + ")", class_: "diag1"});
                var tnode = $("text", house[i].g.node); // text to front
                if (tnode.length) {
                    this.svg.add(house[i].g.node, tnode);
                    this.svg.remove(tnode);
                }
            }
        }
        break;
      case 4: // it's an antidiagonal
        /* TODO: validate grid */
        house.id = coord(this.m[grid.pos.x][grid.pos.y + this.s - 1]);
        house.s = "_4_" + house.id;
        if (this.houses[house.s]) {
            return false;
        }
        house.grid = grid.id;
        m: for (i = 0; i < this.s; i++) {
            house[i] = this.m[grid.pos.x + i][grid.pos.y + this.s - 1 - i];
            for (j = 0; j < house[i].houses.length; j++) if (house[i].houses[j].type === house.type) {
                continue m;
            }
            if (this.rendered) {
                this.svg.use(house[i].g.node, "#diag2",
                    {transform: "translate(" + house[i].g.x + ", " + house[i].g.y + ")", class_: "diag2"});
                var tnode = $("text", house[i].g.node); // text to front
                if (tnode.length) {
                    this.svg.add(house[i].g.node, tnode);
                    this.svg.remove(tnode);
                }
            }
        }
        break;
      default: throw {errmsg: 'unknown house type "' + type + '"'};
    }
    for (i = 0; i < this.s; i++) {
        house[i].houses.push(house);
        if (house.type > 4) {
            for (j = 0, c = 0; j < house[i].houses.length; j++)
                if (house[i].houses[j].type === house.type) {
                c++;
            }
            if (c === 1) {
                house[i].node.addClass('uhouse-' + house.type);
            }
        }
        if (house[i].digit) {
            for (j = 0; j < this.s; j++) {
                house[j].cand[house[i].digit]++;
            }
            house.filled++;
        }
    }
    this.houses[house.s] = house;
    this.resolve();
    this.upd('state');
    return s;
}

// .gethouse(type, grid, q);
sudoku.prototype.gethouse = function (type, grid, q) {
    switch (type) {
      case 0: // it's a column
        return this.houses["_0_" + coord(this.m[grid.pos.x][grid.pos.y + q])];
      case 1: // it's a row
        return this.houses["_1_" + coord(this.m[grid.pos.x + q][grid.pos.y])];
      case 2: // it's a box
        var x = grid.pos.x + (q % this.h) * this.w,
            y = grid.pos.y + Math.floor(q / this.h) * this.h;
        return this.houses["_2_" + coord(this.m[x][y])];
      case 3: // it's a main diagonal
        return this.houses["_3_" + coord(grid.pos)];
      case 4: // it's an antidiagonal
        return this.houses["_4_" + coord(this.m[grid.pos.x][grid.pos.y + this.s - 1])];
      default: throw {errmsg: 'unknown house type "' + type + '"'};
    }
}

// .delhouse(type, grid, q);
// .delhouse(house);
sudoku.prototype.delhouse = function (type, grid, q) {
    if (this.state === -1) {
        throw {errmsg: "Cannot use delhouse while state = -1"};
    }
    var house, i, j, c;
    if (grid === void 0 && q === void 0) {
        house = type;
    } else {
        house = this.gethouse(type, grid, q);
    }
    if (!house) {
        return false;
    }
    if (house.type <= 2) {
        throw {errmsg: "You cann't delete houses with type <= 2"};
    }
    m: for (i = 0; i < this.s; i++) {
        array_del_value(house[i].houses, house);
        if (house[i].digit) for (j = 0; j < this.s; j++) {
            house[j].cand[house[i].digit]--;
        }
        if (this.rendered) {
            for (j = 0; j < house[i].houses.length; j++) if (house[i].houses[j].type === house.type) {
                continue m;
            }
            if (house.type === 3) {
                this.svg.remove($("use.diag1", house[i].g.node));
            } else if (house.type === 4) {
                this.svg.remove($("use.diag2", house[i].g.node));
            } else if (house.type > 4) {
                house[i].g.node.removeClass('uhouse-' + house.type);
            }
        }
    }
    delete this.houses[house.s];
    this.upd('state');
    this.resolve();
    return true;
}

function aa(n) {
    var letters = 26, first = "A";
    var number = "", m = letters, j = 1;
    while (n >= m) {
        n -= m;
        m *= letters;
        j++;
    }
    while (j--) {
        number = String.fromCharCode(first.charCodeAt(0) + n % letters) + number;
        n -= n % letters;
        n /= letters;
    }
    return number;
}

function coord(cell)  { return aa(cell.x) + (1 + cell.y); }
function coordx(cell) { return aa(cell.x); }
function coordy(cell) { return "" + (1 + cell.y); }

sudoku.prototype.getcellbynumber = function (number) {
    for (var y = 0; y < this.my; y++) for (var x = 0; x < this.mx; x++)
        if (this.m[x][y]) if (!number--) return this.m[x][y];
}

sudoku.prototype.selector_hide = function (now) {
    if (now === true) {
        if (this.timers.selector) {
            clearTimeout(this.timers.selector);
            this.timers.selector = false;
        }
        $(this.gr.selector).hide();
        return;
    }
    if (this.timers.selector) return;
    var t = this;
    this.timers.selector = setTimeout(function () {
        $(t.gr.selector).hide();
        t.timers.selector = false;
    }, 1000);
}

sudoku.prototype.solvelogclear = function (message) {
    this.loglines = [];
//    this.nodes.log.html(message ? "<p>" + message + "</p>" : "");
}

sudoku.prototype.solvelog = function (type, o1, o2, o3, o4) {
    return;
    var line, n;
    n = this.loglines.push(line = {type: type});
    switch (type) {
      case 'naked_single':
        line.cells = o1;
        if (line.cells.length > 1) {
            var clist = coord(line.cells[0]) + " — " + this.sym[line.cells[0].digit];
            for (var i = 1; i < line.cells.length; i++)
                clist += "; " + coord(line.cells[i]) + " — " + this.sym[line.cells[i].digit];
            this.nodes.log.append("<p>Naked singles in the cells " + clist + "</p>");
        }
        else
            this.nodes.log.append("<p>Naked single in the cell " +
                coord(line.cells[0]) + " — set to " + this.sym[line.cells[0].digit] + "</p>");
        break;
      case 'hidden_single':
        line.cell = o1;
        line.house = o2;
        this.nodes.log.append("<p>Hidden single in the " + line.house.id + "-" + (["column", "row", "box", "diagonal", "antidiagonal"])[line.house.type] + " — set " + coord(line.cell) + " to " + this.sym[line.cell.digit] + "</p>");
        break;
      case 'naked_subset':
        line.cells = o1;
        line.digits = o2;
        line.done = o3;
        var clist = coord(line.cells[0]);
        for (var i = 1; i < line.cells.length; i++)
            clist += ", " + coord(line.cells[i]);
        var dlist = this.sym[line.digits[0]];
        for (var i = 1; i < line.digits.length; i++)
            dlist += ", " + this.sym[line.digits[i]];
        this.nodes.log.append("<p>Naked " + (['', '', "pair", "triple", "quad"])[line.cells.length] + ": " + clist + " — removing " + dlist + " from common houses</p>");
        break;
      default:
        this.nodes.log.append("<p>" + line.type + "</p>");
        break;
    }
    this.nodes.log.scrollTop(this.nodes.log[0].scrollHeight);
}

function naked_subset_match(cells) {
    var have = [], i, j, k;
    for (i = 0; i < cells.length; i++) for (j = 0; j < cells[i].rcand.length; j++) {
        for (k = 0; k < have.length; k++) if (have[k] == cells[i].rcand[j]) break;
        if (k == have.length) have.push(cells[i].rcand[j]);
    }
    return cells.length == have.length ? have : false;
}

function common_houses(cells) {
    var t = {}, h = [], i, j;
    for (i = 0; i < cells.length; i++) for (j = 0; j < cells[i].houses.length; j++) {
        if (t[cells[i].houses[j].s]) t[cells[i].houses[j].s][0]++;
        else t[cells[i].houses[j].s] = [1, cells[i].houses[j]];
    }
    for (i in t) if (t[i][0] == cells.length) h.push(t[i][1]);
    return h;
}

function in_array(arr, value) {
    for (var i = 0; i < arr.length; i++)
        if (arr[i] == value) return true;
    return false;
}

sudoku.prototype.solve_naked_subset = function () {
    var p, i, j, k, max = Math.floor(this.s / 2), cmax, empty, ret = 0;
    for (p in this.houses)
    if ((cmax = this.s - this.houses[p].filled - this.houses[p].ns - 2) > 0) {
        if (max < cmax) cmax = max;
        for (k = 2; k <= cmax; k++) {
            for (j = 0, empty = []; j < this.s; j++)
            if (this.houses[p][j] && !this.houses[p][j].digit &&
                !this.houses[p][j].solver.ns[this.houses[p].s] &&
                this.houses[p][j].rcand.length <= k)
                empty.push(this.houses[p][j]);
            if (this.solve_naked_subset_rec(this.houses[p], k, empty, [], 0)) {
                ret++;
                break;
            }
        }
    }
    return ret;
}

sudoku.prototype.solve_naked_subset_rec = function (house, s, cells, m, start) {
    var i, j, z, k, mm, have, ch, w;
    for (z = start; z < cells.length; z++) {
        m.push(cells[z]);
        if (m.length < s) {
            if (this.solve_naked_subset_rec(house, s, cells, m, z + 1)) return true;
            m.pop();
            continue;
        }
        ch = common_houses(m);
        if (!ch.length) continue;
        if (have = naked_subset_match(m)) {
            for (i = 0, mm = []; i < m.length; i++) mm.push(m[i]);
            w = [];
            house.ns += s;
            for (i = 0; i < mm.length; i++) mm[i].solver.ns[house.s] = true;
            for (i = 0; i < ch.length; i++) for (j = 0; j < this.s; j++)
            if (!ch[i][j].digit && !in_array(mm, ch[i][j]))
            for (k = 0; k < have.length; k++)
            if (!ch[i][j].cand[have[k]] && !ch[i][j].mask[have[k]]) {
                ch[i][j].mask[have[k]] = true;
                w.push(ch[i][j], have[k]);
            }
            if (w.length)
                this.solvelog('naked_subset', mm, have, w);
            return true;
        }
        m.pop();
    }
    return false;
}

sudoku.prototype.solve1 = function () {
    var x, y, k, cell, nstatus, errors = 0, stumps = 0, toset = [];
    for (x = 0; x < this.mx; x++) for (y = 0; y < this.my; y++) if (this.m[x][y]) { // проверяем все ячейки по очереди
        cell = this.m[x][y];
        if (cell.digit) { // если в ячейке установлена цифра
            if (cell.cand[cell.digit] != cell.houses.length) {
                errors++;
                if (cell.status != 1) {
                    cell.status = 1;
                    $(cell.g.node).removeClass('error-2').addClass('error-1');
                }
            }
            else if (cell.status != 0) {
                cell.status = 0;
                $(cell.g.node).removeClass('error-1').removeClass('error-2');
            }
        }
        else { // если не установлена
            for (k = 1, cell.rcand = []; k <= this.s; k++) {
                if (cell.cand[k] || cell.mask[k]) continue;
                cell.rcand.push(k);
            }
            if (cell.rcand.length == 0) {
                stumps++;
                if (cell.status != 2) {
                    cell.status = 2;
                    $(cell.g.node).removeClass('error-1').addClass('error-2');
                }
            }
            else if (cell.status != 0) {
                cell.status = 0;
                $(cell.g.node).removeClass('error-1').removeClass('error-2');
            }
            if (cell.rcand.length == 1) // naked single
                toset.push([cell, cell.rcand[0]]);
        }
    }
    nstatus = errors ? 1 : (stumps ? 2 : 0);
    if (this.state != nstatus) {
        this.state = nstatus;
        this.upd();
    }

    return toset;
}

sudoku.prototype.solve2 = function () {
    var i, k, p, empty, ns, toset = [];

    for (p in this.houses) {
        for (i = 0, empty = []; i < this.s; i++) if (!this.houses[p][i].digit) empty.push(this.houses[p][i]);

        ns = array([1 + this.s, 2], 0);
        for (i = 0; i < empty.length; i++) for (k = 1; k <= this.s; k++) {
            if (empty[i].cand[k] || empty[i].mask[k]) continue;
            ns[k][0]++; ns[k][1] = empty[i];
        }
        for (k = 1; k <= this.s; k++) if (ns[k][0] == 1) // its hidden single
            toset.push([ns[k][1], k, this.houses[p]]);
    }

    return toset;
}

sudoku.prototype.upd = function () {
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) {
        this.update_w[arguments[i]] = true;
    }
    if (this.timers.update) {
        return;
    }
    var t = this;
    this.timers.update = setTimeout(function () {
        var update_w = t.update_w;
        t.update_w = {};
        t.timers.update = false;
        if (update_w.solve) {
            t.solve();
        }
        if (update_w.state) {
            t.toggle('update');
        }
    }, 1);
}

sudoku.prototype.solve = function () {
    this.solving = true;
    var toset = this.solve1(); // naked singles, errors
    if (toset.length) {
        var cells = [];
        for (var i = 0; i < toset.length; i++) {
            this.select(toset[i][0], toset[i][1], 'solver');
            cells.push(toset[i][0]);
        }
        this.solvelog('naked_single', cells);
        this.upd('solve');
        return;
    }
    if (this.filled === this.total || this.state) {
        this.solving = false;
        for (var i = 0; i < this.aftersolve.length; i++) this.aftersolve[i]();
        this.aftersolve = [];
        return;
    }
    toset = this.solve2(); // hidden singles
    if (toset.length) {
        for (var i = 0; i < toset.length; i++) {
            this.select(toset[i][0], toset[i][1], 'solver');
            this.solvelog('hidden_single', toset[i][0], toset[i][2]);
        }
        this.upd('solve');
        return;
    }
    if (this.solve_naked_subset()) {
        this.upd('solve');
        return;
    }
    this.solving = false;
    for (var i = 0; i < this.aftersolve.length; i++) {
        this.aftersolve[i]();
    }
    this.aftersolve = [];
}

sudoku.prototype.select_user = function (cell) {
    if (cell.digit && cell.source !== 'user') {
        if (this.rendered) {
            $("text", cell.g.node).removeClass(cell.source).addClass('user');
        }
        cell.source = 'user';
        this.ufilled++;
        this.upd('state');
    }
    return this;
}

sudoku.prototype.select = function (cell, k, source, force) {
    var i, j, p;
    if (!this.sources[source]) {
//        this.wlog("unrecognized source: " + source, 'warning');
        return false;
    }
    if (k < 1 || k > this.s || Math.ceil(k) !== k) {
//        this.wlog(source + " tries to select &gt;" + k + "&lt; at " + coord(cell) + " - its not exists", 'warning');
        return false;
    }
    if (cell.digit) {
//        this.wlog(source + " tries to select " + this.sym[k] + " at " + coord(cell) + " - its already set to " + this.sym[cell.digit], 'warning');
        return false;
    }
    if (!force && (cell.cand[k] || cell.mask[k])) {
//        this.wlog(source + " tries to select " + this.sym[k] + " at " + coord(cell) + " - its not possible" + (cell.mask[k] ? " (masked)" : ""), 'warning');
        return false;
    }
    if (this.solving && source !== 'solver') {
        return false;
    }

    cell.digit = +k;
    cell.source = source;
    this.filled++;
    if (source === 'user') {
        s.ufilled++;
    }

    for (p in cell.houses) {
        cell.houses[p].filled++;
        for (i = 0; i < this.s; i++) {
            cell.houses[p][i].cand[k]++;
        }
    }

    if (this.rendered) {
        this.svg.text(cell.g.node,
            cell.g.x + this.g.tx,
            cell.g.y + this.g.ty,
            this.sym[cell.digit],
            {class_: source});
    }
    this.upd('state', source !== 'solver' ? 'solve' : void 0);

    return true;
}

sudoku.prototype.clear = function () {
    if (this.solving) {
        return false;
    }
    this.resolve();
    for (var i = 0; i < this.mx; i++) for (var j = 0; j < this.my; j++) if (this.m[i][j])
        if (this.m[i][j].digit) {
        this.cancel(this.m[i][j], this.m[i][j].source);
    }
}

sudoku.prototype.resolve = function () {
    var p, i, j, k, cell;
    for (p in this.houses) {
        this.houses[p].ns = 0;
    }
    for (j = 0; j < this.my; j++) for (i = 0; i < this.mx; i++) if (cell = this.m[i][j]) {
        cell.solver.ns = {};
        for (k = 1; k <= this.s; k++) {
            cell.mask[k] = 0;
        }
        if (cell.digit && cell.source === 'solver') {
            this.cancel(cell, 'solver');
        }
    }
    this.solvelogclear();
    this.upd('solve');
}

sudoku.prototype.cancel = function (cell, source) {
    var i, j, k;

    if (!cell.digit) {
//        this.wlog(source + " tries to cancel " + coord(cell) + " - its empty", 'warning');
        return false;
    }
    if (cell.source !== source) {
//        if (source != 'user')
//            this.wlog(source + " tries to cancel " + coord(cell) + " - access denied", 'warning');
        return false;
    }
    if (this.solving) {
        return false;
    }
    k = cell.digit;
    cell.digit = 0;
    this.filled--;
    if (source === 'user') {
        s.ufilled--;
    }

    for (p in cell.houses) {
        cell.houses[p].filled--;
        for (i = 0; i < this.s; i++) {
            cell.houses[p][i].cand[k]--;
        }
    }

    if (this.rendered) {
        this.svg.remove($("text", cell.g.node));
    }
    this.upd('state');
    this.resolve();

    return true;
}

/**  Guess-and-check solver  **/

sudoku.prototype.gnc_start = function () {
    if (this.gnc) {
        return;
    }
    this.gnc = true;
    this.gnc_cycle();
    this.toggle('gnc_state');
}
sudoku.prototype.gnc_stop = function () {
    if (!this.gnc) {
        return;
    }
    if (this.timers.gnc) {
        clearTimeout(this.timers.gnc);
        this.timers.gnc = false;
    }
    this.gnc = false;
    this.toggle('gnc_state');
}
sudoku.prototype.gnc_toggle = function () {
    if (this.gnc) {
        this.gnc_stop();
    } else {
        this.gnc_start();
    }
}
sudoku.prototype.gnc_reset = function () {
    for (var j = this.my-1; j >= 0; j--) for (var i = this.mx-1; i >= 0; i--) if (
        this.m[i][j] && this.m[i][j].digit && this.m[i][j].source === 'gnc') {
        this.cancel(this.m[i][j], 'gnc');
    }
}

sudoku.prototype.gnc_cancel = function () {
    if (!this.gnc || this.timers.gnc) return;
    var l = false, k, t = this;
    for (var j = this.my-1; j >= 0; j--) for (var i = this.mx-1; i >= 0; i--) if (
        this.m[i][j] && this.m[i][j].digit && this.m[i][j].source === 'gnc') {
        l = this.m[i][j];
        k = this.m[i][j].digit;
        i = j = -1;
    }
    if (!l) {
        this.gnc = false;
        this.toggle('gnc_state');
        return;
    }
    this.cancel(l, 'gnc');
    var next = function () {
        if (!t.gnc || t.timers.gnc) return;
        if (t.state) {
            t.gnc_cancel();
            return;
        }
        while (++k <= t.s && (l.cand[k] || l.mask[k]));
        if (k === t.s + 1) {
            t.timers.gnc = setTimeout(function () { t.timers.gnc = false; t.gnc_cancel(); }, t.gnc_speed);
            return;
        }
        t.select(l, k, 'gnc');
        t.aftersolve.push(function () {
            t.timers.gnc = setTimeout(function () { t.timers.gnc = false; t.gnc_cycle(); }, t.gnc_speed);
        });
    };
    this.aftersolve.push(function () {
        t.timers.gnc = setTimeout(function () { t.timers.gnc = false; next(); }, t.gnc_speed);
    });
}

sudoku.prototype.gnc_cycle = function () {
    if (!this.gnc || this.timers.gnc) return;
    var t = this;
    if (this.state) {
        this.gnc_cancel();
        return;
    }
    if (this.filled === this.total) {
        this.gnc = false;
        this.toggle('gnc_state');
        return;
    }
    for (var j = 0; j < this.my; j++) for (var i = 0; i < this.mx; i++)
        if (this.m[i][j] && !this.m[i][j].digit)
        for (var k = 1; k <= this.s; k++) if (!this.m[i][j].cand[k] && !this.m[i][j].mask[k]) {
        this.select(this.m[i][j], k, 'gnc');
        this.aftersolve.push(function () {
            t.timers.gnc = setTimeout(function () { t.timers.gnc = false; t.gnc_cycle(); }, t.gnc_speed);
        });
        return;
    }
    this.gnc = false;
    this.toggle('gnc_state');
}

(function() {
  var DLList, DLSet, HiddenSingles, HouseList, NakedSingles, NakedSubsets, SudokuCell, SudokuGrid, SudokuRenderer, SudokuSolver, extend, _aa, _aa2i;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  extend = function(to, from) {
    var i;
    if (from != null) {
      for (i in from) {
        to[i] = from[i];
      }
    }
    return null;
  };
  Array.prototype.fill = function(dim, value, level) {
    var i, _ref, _ref2;
    if (level == null) {
      level = 0;
    }
    if (typeof dim === 'number' && (value != null) && dim > 0) {
      for (i = 0; i < dim; i += 1) {
        this[i] = value;
      }
      return this;
    }
    if (dim[level] < 0) {
      return this;
    }
    if (dim.length === 1 + level) {
      if (value != null) {
        for (i = 0, _ref = dim[level]; i < _ref; i += 1) {
          this[i] = value;
        }
      }
    } else {
      for (i = 0, _ref2 = dim[level]; i < _ref2; i += 1) {
        this[i] = [].fill(dim, value, 1 + level);
      }
    }
    return this;
  };
  Array.prototype.remove = function(index) {
    var i, _ref, _ref2;
    if (!((0 <= +index && +index <= this.length))) {
      return this;
    }
    for (i = _ref = 1 + index, _ref2 = this.length; i < _ref2; i += 1) {
      this[i - 1] = this[i];
    }
    this.pop();
    return this;
  };
  Array.prototype.eliminate = function(value) {
    var i;
    i = 0;
    while (i < this.length) {
      if (this[i] === value) {
        this.remove(i);
      } else {
        i += 1;
      }
    }
    return this;
  };
  String.prototype.repeat = function(times) {
    var i, ret;
    ret = '';
    if (times > 0) {
      for (i = 0; i < times; i += 1) {
        ret += this;
      }
    }
    return ret;
  };
  String.prototype.pad = function(len, str, type) {
    var half, input, repeater, togo;
    half = '';
    repeater = function(s, len) {
      var collect;
      collect = '';
      while (collect.length < len) {
        collect += s;
      }
      return collect = collect.substr(0, len);
    };
    if (type !== 'left' && type !== 'right' && type !== 'both') {
      type = 'right';
    }
    togo = len - this.length;
    if (togo > 0) {
      return this;
    } else if (type === 'left') {
      return repeater(str, togo) + this;
    } else if (type === 'right') {
      return this + repeater(str, togo);
    } else if (type === 'both') {
      half = repeater(str, Math.ceil(togo / 2));
      return input = (half + this + half).substr(0, len);
    }
  };
  if (typeof process === "undefined" || process === null) {
    process = {
      nextTick: function(f) {
        return setTimeout(f, 1);
      }
    };
  }
  DLList = (function() {
    function DLList() {
      this.head = this.tail = false;
      this.length = 0;
    }
    DLList.prototype.add = function(elem) {
      var wrp;
      this.head = wrp = {
        e: elem,
        next: this.head,
        prev: false
      };
      if (wrp.next) {
        wrp.next.prev = wrp;
      } else {
        this.tail = wrp;
      }
      this.length += 1;
      return wrp;
    };
    DLList.prototype.find = function(elem) {
      var it;
      it = this.head;
      while (it) {
        if (it.e === elem) {
          break;
        }
        it = it.next;
      }
      return it;
    };
    DLList.prototype.remove = function(wrp) {
      if (wrp === this.head) {
        this.head = wrp.next;
      } else {
        wrp.prev.next = wrp.next;
      }
      if (wrp === this.tail) {
        this.tail = wrp.prev;
      } else {
        wrp.next.prev = wrp.prev;
      }
      this.length -= 1;
      wrp.dead = true;
      return this;
    };
    DLList.prototype.iter = function(f) {
      var it, r;
      it = this.head;
      while (it) {
        r = f(it.e);
        if (r === false) {
          break;
        }
        it = it.next;
      }
      return this;
    };
    return DLList;
  })();
  DLSet = (function() {
    __extends(DLSet, DLList);
    function DLSet() {
      DLSet.__super__.constructor.apply(this, arguments);
    }
    DLSet.prototype.add = function(elem) {
      var wrp;
      if (this[elem.id] != null) {
        throw new Error('Duplicate element in set');
      }
      wrp = DLSet.__super__.add.call(this, elem);
      return this[elem.id] = {
        e: elem,
        w: wrp
      };
    };
    DLSet.prototype.remove = function(elem) {
      var ref;
      ref = typeof elem === 'string' ? this[elem] : typeof elem === 'object' && (elem.id != null) ? this[elem.id] : elem;
      if (typeof ref !== 'object') {
        return false;
      }
      DLSet.__super__.remove.call(this, ref.w);
      delete this[ref.e.id];
      return ref;
    };
    return DLSet;
  })();
  _aa = function(n) {
    var aa, p;
    p = Math.floor(Math.log(26 + 25 * n) / Math.log(26));
    aa = '';
    n -= Math.floor((Math.pow(26, p) - 26) / 25);
    while (p) {
      aa = String.fromCharCode('A'.charCodeAt(0) + n % 26) + aa;
      n = Math.floor(n / 26);
      p -= 1;
    }
    return aa;
  };
  _aa2i = function(aa) {
    var i, n, p, _ref;
    n = (Math.pow(26, aa.length) - 26) / 25;
    p = 1;
    for (i = _ref = aa.length - 1; i >= 0; i += -1) {
      n += (aa.charCodeAt(i) - 'A'.charCodeAt(0)) * p;
      p *= 10;
    }
    return n;
  };
  SudokuRenderer = (function() {
    __extends(SudokuRenderer, EventEmitter);
    SudokuRenderer.prototype.id = 0;
    function SudokuRenderer(opts) {
      var defs, _ref;
      if (!(this instanceof SudokuRenderer)) {
        return new SudokuRenderer(opts);
      }
      defs = {
        node: $(),
        interactive: true,
        axisLabels: true,
        keyboard: false
      };
      extend(defs, opts);
      this.id = "g" + SudokuRenderer.prototype.id;
      SudokuRenderer.prototype.id += 1;
      this.grid = (_ref = defs.grid) != null ? _ref : new SudokuGrid;
      if (!(this.grid instanceof SudokuGrid)) {
        throw new Error('Grid is not of class SudokuGrid');
      }
      this.g = {
        cell_h: 50,
        cell_w: 50,
        sel_h: 20,
        sel_w: 20,
        padding: 5.5,
        canv_w: 0,
        canv_h: 0,
        sel_nh: 0,
        sel_nw: 0,
        sel_th: 0,
        sel_tw: 0
      };
      this.acell = this.agrid = false;
      this.rootNode = defs.node;
      this.svg = false;
      this.needrender = false;
      this.rendered = false;
      this._axisLabels = !!defs.axisLabels;
      this._kbd = false;
      this.rootNode.svg({
        onLoad: __bind(function(svg) {
          this.svg = svg;
          if (this.needrender) {
            return this.render();
          }
        }, this)
      });
      this.interactive = !!defs.interactive;
      this.timers = {
        selector: false,
        update: false
      };
      if (this.grid.headCell) {
        this.render();
      }
      if (defs.keyboard) {
        this.keyboardOn();
      }
      this.grid.on('loadMap', __bind(function() {
        this.selectGrid(0);
        return this.render();
      }, this));
      this.grid.on('unloadMap', __bind(function() {
        return this.rendered = this.needrender = this.acell = this.agrid = false;
      }, this));
      this.grid.on('loadSymb', __bind(function() {
        return this._loadSymb();
      }, this));
      this.grid.on('set', __bind(function(cell) {
        return this._set(cell);
      }, this));
      this.grid.on('unset', __bind(function(cell) {
        return this._unset(cell);
      }, this));
      this.grid.on('cellChsrc', __bind(function(cell, old) {
        return this._cellChsrc(cell, old);
      }, this));
      this.grid.on('addHouse', __bind(function(house) {
        return this._addHouse(house);
      }, this));
      this.grid.on('delHouse', __bind(function(house) {
        return this._delHouse(house);
      }, this));
      this.grid.on('touch', __bind(function(cell) {
        return this._touch(cell);
      }, this));
      this.grid.on('error', __bind(function(cell) {
        return this._error(cell);
      }, this));
      this.grid.on('fix', __bind(function(cell) {
        return this._fix(cell);
      }, this));
      this.grid.on('mark', __bind(function(cells) {
        var cell, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = cells.length; _i < _len; _i++) {
          cell = cells[_i];
          _results.push(this.showCandidates(cell));
        }
        return _results;
      }, this));
      this.grid.on('unmark', __bind(function(cells) {
        var cell, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = cells.length; _i < _len; _i++) {
          cell = cells[_i];
          _results.push(this.showCandidates(cell));
        }
        return _results;
      }, this));
      this.grid.on('markHouse', __bind(function(house, n) {
        return this._markHouse(house, n);
      }, this));
      this.grid.on('unmarkHouse', __bind(function(house) {
        return this._unmarkHouse(house);
      }, this));
    }
    SudokuRenderer.prototype._markHouse = function(house, n) {
      var cell, _i, _len;
      for (_i = 0, _len = house.length; _i < _len; _i++) {
        cell = house[_i];
        $(cell[this.id].node).children("rect").addClass("light" + n);
      }
    };
    SudokuRenderer.prototype._unmarkHouse = function(house) {
      var cell, _i, _len;
      for (_i = 0, _len = house.length; _i < _len; _i++) {
        cell = house[_i];
        $(cell[this.id].node).children("rect").removeClass("light1 light2 light3 light4");
      }
    };
    SudokuRenderer.prototype.hideCandidates = function(cell) {
      var cg;
      cg = cell[this.id];
      if (cg.candgridNode == null) {
        return;
      }
      this.svg.remove($(cg.candgridNode));
      return cg.candgridNode = null;
    };
    SudokuRenderer.prototype.showCandidates = function(cell) {
      var cg, d, i, j, startx, starty, stepx, stepy, x, y, _ref, _ref2, _ref3;
      if (cell.digit) {
        return;
      }
      cg = cell[this.id];
      if (cg.candgridNode != null) {
        this.svg.remove($(cg.candgridNode));
      }
      cg.candgridNode = this.svg.group(cg.node, {
        class_: 'candgrid'
      });
      stepx = this.g.cell_w / this.g.sel_nw;
      startx = cg.x + stepx / 2;
      stepy = this.g.cell_h / this.g.sel_nh;
      starty = cg.y + 4 + stepy / 2;
      for (j = 0, _ref = this.g.sel_nw; j < _ref; j += 1) {
        for (i = 0, _ref2 = this.g.sel_nw; i < _ref2; i += 1) {
          d = 1 + j * this.g.sel_nw + i;
          if (!cell.cand[d] && !cell.mask[d]) {
            x = startx + i * stepx;
            y = starty + j * stepy;
            if (((_ref3 = cell.colors) != null ? _ref3[d] : void 0) != null) {
              this.svg.circle(cg.candgridNode, x, y - 3, 6, {
                fill: cell.colors[d],
                opacity: 0.4
              });
            }
            this.svg.text(cg.candgridNode, x, y, this.grid.symb[d], {
              class_: 'cand'
            });
          }
        }
      }
    };
    SudokuRenderer.prototype._touch = function(cell) {
      var _ref;
      if (cell.digit) {
        return;
      }
      if ((1 <= (_ref = cell.rcand.length) && _ref <= 4) || (cell.colors != null)) {
        return this.showCandidates(cell);
      } else {
        return this.hideCandidates(cell);
      }
    };
    SudokuRenderer.prototype._error = function(cell) {
      if (!this.rendered) {
        return;
      }
      return $(cell[this.id].node).addClass('error');
    };
    SudokuRenderer.prototype._fix = function(cell) {
      if (!this.rendered) {
        return;
      }
      return $(cell[this.id].node).removeClass('error');
    };
    SudokuRenderer.prototype.keyboardOff = function() {
      if (!this._kbd) {
        return this;
      }
      $(document).unbind("keydown.SudokuRenderer_" + this.id);
      this._kbd = false;
      if (this.rendered) {
        $(this.gr.cells).removeClass('keyboard');
      }
      return this;
    };
    SudokuRenderer.prototype.keyboardOn = function() {
      if (this._kbd) {
        return this;
      }
      if (!this.interactive) {
        throw new Error('Sudoku not interactive');
      }
      console.log('enabling keyboard', document);
      $(document).bind("keydown.SudokuRenderer_" + this.id, __bind(function(e) {
        var _ref, _ref2;
        if (!this.rendered) {
          return;
        }
        if (typeof e.target.form === 'object' || e.altKey || e.shiftKey) {
          return;
        }
        if (e.ctrlKey && e.keyCode === 90) {
          this.grid.undo();
        }
        if (e.ctrlKey || e.metaKey) {
          return;
        }
        if (!this.acell) {
          this.selectCell(this.grid.headCell);
        }
        if ((49 <= (_ref = e.keyCode) && _ref <= 69)) {
          if (this.acell.digit) {
            this.acell.unset(this.acell.source);
          }
          try {
            this.acell.set(e.keyCode - 48, 'user');
          } catch (e) {

          }
        } else if ((97 <= (_ref2 = e.keyCode) && _ref2 <= 105)) {
          if (this.acell.digit) {
            this.acell.unset(this.acell.source);
          }
          try {
            this.acell.set(e.keyCode - 96, 'user');
          } catch (e) {

          }
        } else if (e.keyCode === 8) {
          this.selectCell(this.acell.prev || this.grid.tailCell);
          if (this.acell.digit) {
            this.acell.unset(this.acell.source);
          }
        } else if (e.keyCode === 46) {
          if (this.acell.digit) {
            this.acell.unset(this.acell.source);
          }
        } else if (e.keyCode === 37) {
          this.selectCell(this.acell.left);
        } else if (e.keyCode === 38) {
          this.selectCell(this.acell.top);
        } else if (e.keyCode === 39) {
          this.selectCell(this.acell.right);
        } else if (e.keyCode === 40) {
          this.selectCell(this.acell.bottom);
        } else {
          if (window.pkc) {
            console.log('down', e.keyCode, e);
          }
          return;
        }
        return false;
      }, this));
      this._kbd = true;
      if (this.rendered) {
        $(this.gr.cells).addClass('keyboard');
      }
      return this;
    };
    SudokuRenderer.prototype._loadSymb = function() {
      var cell, i, _ref, _results;
      if (!this.rendered) {
        return;
      }
      cell = this.grid.headCell;
      while (cell) {
        if (cell.digit) {
          $('text', cell[this.id].node).text(this.grid.symb[cell.digit]);
        }
        cell = cell.next;
      }
      if (this.interactive) {
        _results = [];
        for (i = 1, _ref = this.s; i <= _ref; i += 1) {
          _results.push($('text', this.gr.selector.childNodes[i]).text(this.grid.symb[i]));
        }
        return _results;
      }
    };
    SudokuRenderer.prototype._set = function(cell) {
      var cg;
      if (!this.rendered) {
        return;
      }
      cg = cell[this.id];
      this.hideCandidates(cell);
      return this.svg.text(cg.node, cg.x + this.g.tx, cg.y + this.g.ty, this.grid.symb[cell.digit], {
        class_: cell.source
      });
    };
    SudokuRenderer.prototype._unset = function(cell) {
      if (!this.rendered) {
        return;
      }
      return this.svg.remove($('text', cell[this.id].node));
    };
    SudokuRenderer.prototype._cellChsrc = function(cell, old) {
      if (!this.rendered) {
        return;
      }
      return $('text', cell[this.id].node).removeClass(old).addClass(cell.source);
    };
    SudokuRenderer.prototype._addHouse = function(house) {
      var cell, cg, gnode, tnode, _i, _len, _ref, _ref2, _results;
      if (!this.rendered) {
        return;
      }
      if ((_ref = house.type) === 'diag1' || _ref === 'diag2') {
        _results = [];
        for (_i = 0, _len = house.length; _i < _len; _i++) {
          cell = house[_i];
          cg = cell[this.id];
          if (((_ref2 = cell.houses[house.type]) != null ? _ref2.length : void 0) !== 1) {
            continue;
          }
          this.svg.use(cg.node, '#' + house.type, {
            transform: "translate(" + cg.x + ", " + cg.y + ")",
            class_: house.type
          });
          tnode = $(cg.node).children('text');
          gnode = $(cg.node).children('g');
          if (tnode.length) {
            this.svg.add(cg.node, tnode);
            this.svg.remove(tnode);
          }
          _results.push(gnode.length ? (this.svg.add(cg.node, gnode), this.svg.remove(gnode)) : void 0);
        }
        return _results;
      }
    };
    SudokuRenderer.prototype._delHouse = function(house) {
      var cell, _i, _len, _ref, _ref2, _results;
      if (!this.rendered) {
        return;
      }
      if ((_ref = house.type) === 'diag1' || _ref === 'diag2') {
        _results = [];
        for (_i = 0, _len = house.length; _i < _len; _i++) {
          cell = house[_i];
          if (((_ref2 = cell.houses[house.type]) != null ? _ref2.length : void 0) !== 0) {
            continue;
          }
          _results.push(this.svg.remove($("use." + house.type, cell[this.id].node)));
        }
        return _results;
      }
    };
    SudokuRenderer.prototype._cellClick = function(e, cell) {
      if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) {
        return;
      }
      if (cell.digit && cell.source !== 'user') {
        return cell.setUser();
      } else if (cell.digit) {
        return cell.unset('user');
      } else {
        this.selectCell(cell);
        return this.showSelector();
      }
    };
    SudokuRenderer.prototype.selectCell = function(cell) {
      var cg, oldcell, _ref;
      if (!this.grid.isCell(cell)) {
        throw new Error('No such cell');
      }
      _ref = [this.acell, cell], oldcell = _ref[0], this.acell = _ref[1];
      if (!this.rendered) {
        return this;
      }
      if (oldcell !== false) {
        $(oldcell[this.id].node).removeClass('active');
      }
      if (this.acell) {
        cg = this.acell[this.id];
        $(cg.node).addClass('active');
      }
      return this;
    };
    SudokuRenderer.prototype._selectorClick = function(e, k) {
      if (!e.shiftKey && (this.acell.cand[k] || this.acell.mask[k])) {
        return;
      }
      this.hideSelector(true);
      return this.acell.set(k, 'user', e.shiftKey);
    };
    SudokuRenderer.prototype._pos = function(i, j) {
      var _ref;
      if (!(j != null)) {
        _ref = [i.i, i.j], i = _ref[0], j = _ref[1];
      }
      return {
        x: this.g.padding + this.g.cell_w * (j + 1),
        y: this.g.padding + this.g.cell_h * (i + 1)
      };
    };
    SudokuRenderer.prototype._center = function(i, j) {
      var _ref;
      if (!(j != null)) {
        _ref = [i.i, i.j], i = _ref[0], j = _ref[1];
      }
      return {
        x: this.g.padding + this.g.cell_w * (j + 1.5),
        y: this.g.padding + this.g.cell_h * (i + 1.5)
      };
    };
    SudokuRenderer.prototype.showSelector = function() {
      var acg, k, nx, ny, _ref;
      if (!(this.interactive && this.rendered)) {
        throw new Error('Grid is not interactive or not rendered');
      }
      if (!this.acell) {
        throw new Error('No cell selected');
      }
      if (this.timers.selector) {
        clearTimeout(this.timers.selector);
        this.timers.selector = false;
      }
      for (k = 0, _ref = this.grid.s; k < _ref; k += 1) {
        if (this.acell.cand[1 + k] || this.acell.mask[1 + k]) {
          $(this.gr.selector.childNodes[k]).addClass('disabled');
        } else {
          $(this.gr.selector.childNodes[k]).removeClass('disabled');
        }
      }
      acg = this.acell[this.id];
      nx = acg.x + 0.5 * (this.g.cell_w - this.g.sel_tw);
      ny = acg.y + 0.5 * (this.g.cell_h - this.g.sel_th);
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
      $(this.gr.selector).attr('transform', "translate(" + nx + "," + ny + ")").show();
      this.gr.selector.scrollIntoViewIfNeeded();
      return this;
    };
    SudokuRenderer.prototype.hideSelector = function(now) {
      if (now) {
        if (this.timers.selector) {
          clearTimeout(this.timers.selector);
          this.timers.selector = false;
        }
        $(this.gr.selector).hide();
        return this;
      }
      if (this.timers.selector) {
        return this;
      }
      return this.timers.selector = setTimeout((__bind(function() {
        $(this.gr.selector).hide();
        return this.timers.selector = false;
      }, this)), 1000);
    };
    SudokuRenderer.prototype.render = function() {
      var boxId, cell, cg, d, g, gr, grid, i, j, k, n, options, p, q, stime, svg, svgdefs, x, y, z, _len, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      if (!this.svg) {
        this.needrender = true;
        return this;
      }
      this.needrender = false;
      stime = (new Date()).getTime();
      svg = this.svg;
      g = this.g;
      g.canv_w = (this.grid.mj + 1) * g.cell_w + 2 * g.padding;
      g.canv_h = (this.grid.mi + 1) * g.cell_h + 2 * g.padding;
      g.tx = g.cell_w / 2;
      g.ty = g.cell_h / 2 + 7;
      svg.clear(true);
      svg.configure({
        width: g.canv_w,
        height: g.canv_h
      }, true);
      svg.style("@-webkit-keyframes 'appear' {\n    from {\n        opacity: 0;\n    }\n    to {\n        opacity: 1;\n    }\n}\n\n#cells rect { fill: #fff; stroke: #000; stroke-width: 0.2; }\n#cells rect.light1 { fill: #ddddff; }\n#cells rect.light2 { fill: #ddffdd; }\n#cells rect.light1.light2 { fill: #ddffff; }\n#cells rect.light3 { fill: #ffdddd; }\n#cells rect.light1.light3 { fill: #ffddff; }\n#cells rect.light2.light3 { fill: #ffffdd; }\n#cells.keyboard g.active rect { fill: #ccc; }\n#cells g.error rect { fill: #f45252; }\n#cells g.error.active rect { fill: #f42222; }\n#cells text { fill: #666; cursor: default; text-anchor: middle; }\n#cells text.user { fill: #000; }\n#cells text.solver { fill: #039; -webkit-animation: 'appear' 1s; }\n#cells text.gnc { fill: #080; -webkit-animation: 'appear' 0.2s; }\n#cells text.cand { fill: #222; cursor: default; text-anchor: middle; font-family: serif; font-size: 10px; }\n\n#selector { opacity: 0.7; }\n#selector:hover { opacity: 0.9; }\n#selector rect { fill: #fff; stroke: #000; stroke-width: 0.2; stroke-linecap: round; }\n#selector g:hover rect { fill: #f3f3f3; }\n#selector text { fill: #000; font-size: 12px; text-anchor: middle; cursor: default; }\n#selector g.disabled rect { fill: #fff; }\n#selector g.disabled text { fill: #ccc; }\n\n#grid_id { opacity: 0.9; fill: #000; stroke: #fff; stroke-width: 2; text-anchor: middle; cursor: default; }\n#grid_id text.active { fill: #e00; }\n#grid_id text:hover { stroke: #66e; }\n");
      svgdefs = svg.defs();
      d = svg.group(svgdefs, {
        id: 'diag1',
        fill: '#ccc'
      });
      svg.circle(d, 0.2 * g.cell_w, 0.2 * g.cell_h, 0.1 * g.cell_w);
      svg.circle(d, 0.5 * g.cell_w, 0.5 * g.cell_h, 0.1 * g.cell_w);
      svg.circle(d, 0.8 * g.cell_w, 0.8 * g.cell_h, 0.1 * g.cell_w);
      d = svg.group(svgdefs, {
        id: 'diag2',
        fill: '#ccc'
      });
      svg.circle(d, 0.8 * g.cell_w, 0.2 * g.cell_h, 0.1 * g.cell_w);
      svg.circle(d, 0.5 * g.cell_w, 0.5 * g.cell_h, 0.1 * g.cell_w);
      svg.circle(d, 0.2 * g.cell_w, 0.8 * g.cell_h, 0.1 * g.cell_w);
      gr = this.gr = {};
      if (this._axisLabels) {
        gr.coords = svg.group({
          fill: '#888',
          'font-size': "" + (0.33 * g.cell_h) + "px",
          cursor: 'default',
          'text-anchor': 'middle'
        });
        for (j = 0, _ref = this.grid.mj; j < _ref; j += 1) {
          svg.text(gr.coords, this._center(0, j).x, g.padding + g.cell_h - 8, "" + (j + 1));
        }
        for (i = 0, _ref2 = this.grid.mi; i < _ref2; i += 1) {
          svg.text(gr.coords, g.padding + g.cell_w - 10, this._center(i, 0).y + 5, _aa(i));
        }
      }
      gr.cells = svg.group({
        id: 'cells',
        'font-size': "" + (0.7 * g.cell_h) + "px",
        class_: this._kbd ? 'keyboard' : ''
      });
      cell = this.grid.headCell;
      while (cell) {
        p = this._pos(cell);
        cg = cell[this.id] = {
          node: svg.group(gr.cells),
          x: p.x,
          y: p.y,
          cand: false
        };
        svg.rect(cg.node, p.x, p.y, g.cell_w, g.cell_h);
        $(cg.node).bind('click', __bind(function(cell) {
          return __bind(function(e) {
            if (this.interactive) {
              return this._cellClick(e, cell);
            }
          }, this);
        }, this)(cell));
        if (cell.err) {
          $(cg.node).addClass('error');
        }
        if (cell === this.acell) {
          $(cg.node).addClass('active');
        }
        if ((_ref3 = cell.houses.diag1) != null ? _ref3.length : void 0) {
          svg.use(cg.node, '#diag1', {
            transform: "translate(" + cg.x + ", " + cg.y + ")",
            class_: 'diag1'
          });
        }
        if ((_ref4 = cell.houses.diag2) != null ? _ref4.length : void 0) {
          svg.use(cg.node, '#diag2', {
            transform: "translate(" + cg.x + ", " + cg.y + ")",
            class_: 'diag2'
          });
        }
        if (cell.digit) {
          svg.text(cg.node, cg.x + g.tx, cg.y + g.ty, this.grid.symb[cell.digit], {
            class_: cell.source
          });
        }
        cell = cell.next;
      }
      gr.hborder = svg.group({
        stroke: '#888',
        'stroke-width': '2.5',
        'stroke-linecap': 'round'
      });
      gr.mborder = svg.group({
        stroke: '#000',
        'stroke-width': '2.5',
        'stroke-linecap': 'round'
      });
      cell = this.grid.headCell;
      while (cell) {
        i = cell.i;
        j = cell.j;
        p = cell[this.id];
        q = this._pos(i + 1, j + 1);
        if (this.grid.boxes) {
          boxId = cell.houses.box.head.e.id;
          if (cell.left.j + 1 === cell.j && boxId !== cell.left.houses.box.head.e.id) {
            svg.path(gr.hborder, "M" + p.x + "," + p.y + "L" + p.x + "," + q.y);
          }
          if (cell.top.i + 1 === cell.i && boxId !== cell.top.houses.box.head.e.id) {
            svg.path(gr.hborder, "M" + p.x + "," + p.y + "L" + q.x + "," + p.y);
          }
        }
        if (cell.left.j + 1 !== cell.j) {
          svg.path(gr.mborder, "M" + p.x + "," + p.y + "L" + p.x + "," + q.y);
        }
        if (cell.top.i + 1 !== cell.i) {
          svg.path(gr.mborder, "M" + p.x + "," + p.y + "L" + q.x + "," + p.y);
        }
        if (cell.bottom.i - 1 !== cell.i) {
          svg.path(gr.mborder, "M" + p.x + "," + q.y + "L" + q.x + "," + q.y);
        }
        if (cell.right.j - 1 !== cell.j) {
          svg.path(gr.mborder, "M" + q.x + "," + p.y + "L" + q.x + "," + q.y);
        }
        cell = cell.next;
      }
      gr.grid_id = svg.group({
        id: 'grid_id',
        'font-size': "" + (0.8 * this.grid.s * g.cell_h) + "px"
      });
      _ref5 = this.grid.grids;
      for (z = 0, _len = _ref5.length; z < _len; z++) {
        grid = _ref5[z];
        x = grid.pos[this.id].x + 0.5 * this.grid.s * g.cell_w;
        y = grid.pos[this.id].y + 0.7 * this.grid.s * g.cell_h;
        options = grid === this.grid.agrid ? {
          class_: 'active'
        } : {};
        grid.id_node = svg.text(gr.grid_id, x, y, "" + (z + 1), options);
        $(grid.id_node).click(__bind(function(z) {
          return __bind(function() {
            return this.selectGrid(z);
          }, this);
        }, this)(z));
      }
      $(gr.grid_id).hide();
      if (this.interactive) {
        gr.selector = svg.group({
          id: 'selector'
        });
        g.sel_nw = Math.ceil(Math.sqrt(this.grid.s));
        g.sel_nh = Math.floor(Math.sqrt(this.grid.s));
        g.sel_tw = g.sel_nw * g.sel_w;
        g.sel_th = g.sel_nh * g.sel_h;
        k = 1;
        for (j = 0, _ref6 = g.sel_nh; j < _ref6; j += 1) {
          for (i = 0, _ref7 = g.sel_nw; i < _ref7; i += 1) {
            n = svg.group(gr.selector);
            svg.rect(n, i * g.sel_w, j * g.sel_h, g.sel_w, g.sel_h);
            if (k > this.grid.s) {
              continue;
            }
            svg.text(n, g.sel_w * (i + 0.5), g.sel_h * (j + 0.7), this.grid.symb[k]);
            $(n).bind('click', __bind(function(k) {
              return __bind(function(e) {
                return this._selectorClick(e, k);
              }, this);
            }, this)(k));
            k += 1;
          }
        }
        svg.path(gr.selector, "M0,0L0," + g.sel_th + "L" + g.sel_tw + "," + g.sel_th + "L" + g.sel_tw + ",0L0,0", {
          fill: 'none',
          stroke: '#888',
          'stroke-width': '1.5'
        });
        $(gr.selector).bind('mouseover', __bind(function() {
          if (this.timers.selector) {
            clearTimeout(this.timers.selector);
            return this.timers.selector = false;
          }
        }, this)).bind('mouseout', __bind(function() {
          return this.hideSelector();
        }, this)).hide();
      }
      this.rendered = true;
      if (window.console != null) {
        console.log("rendered in: " + ((new Date()).getTime() - stime));
      }
      return this;
    };
    SudokuRenderer.prototype.showGridId = function() {
      if (this.rendered) {
        return $(this.gr.grid_id).show();
      }
    };
    SudokuRenderer.prototype.hideGridId = function() {
      if (this.rendered) {
        return $(this.gr.grid_id).hide();
      }
    };
    SudokuRenderer.prototype.selectGrid = function(grid) {
      if (this.agrid && this.rendered) {
        $(this.agrid.id_node).removeClass('active');
      }
      this.agrid = false;
      if (typeof grid === 'number' || typeof grid === 'string') {
        if (this.grid.grids[+grid] != null) {
          this.agrid = this.grid.grids[+grid];
        }
      } else if (typeof grid === 'object' && (this.grid.grids[grid.id] != null)) {
        this.agrid = this.grid.grids[grid.id];
      }
      if (this.agrid && this.rendered) {
        $(this.agrid.id_node).addClass('active');
      }
      this.emit('selectGrid');
      return this;
    };
    return SudokuRenderer;
  })();
  this.SudokuRenderer = SudokuRenderer;
  NakedSingles = (function() {
    function NakedSingles(solver) {
      this.solver = solver;
      this.grid = this.solver.grid;
      this.cand = [];
      this.found = [];
      this.enabled = true;
      this.sbs = true;
      this.touchCB = __bind(function(cell) {
        if (cell.digit) {
          return;
        }
        if (this.enabled && cell.rcand.length === 1) {
          return this.cand.push(cell);
        }
      }, this);
      if (this.enabled) {
        this.grid.on('touch', this.touchCB);
      }
    }
    NakedSingles.prototype.enable = function() {
      if (this.enabled) {
        return;
      }
      this.enabled = true;
      return this.grid.on('touch', this.touchCB);
    };
    NakedSingles.prototype.disable = function() {
      if (!this.enabled) {
        return;
      }
      this.enabled = false;
      return this.grid.removeListener('touch', this.touchCB);
    };
    NakedSingles.prototype.set = function() {
      var cand, cell, result, _i, _len;
      cand = this.cand;
      this.cand = [];
      result = false;
      for (_i = 0, _len = cand.length; _i < _len; _i++) {
        cell = cand[_i];
        if (cell.rcand.length === 1) {
          try {
            cell.set(cell.rcand[0], 'solver');
            result = true;
          } catch (_e) {}
        }
      }
      return result;
    };
    NakedSingles.prototype.search = function() {
      var cand, cell, cellList, one, text, _i, _len;
      if (this.found.length) {
        throw new Error('New search while old results are not used!');
      }
      cellList = [];
      cand = this.cand;
      this.cand = [];
      for (_i = 0, _len = cand.length; _i < _len; _i++) {
        cell = cand[_i];
        if ((cell.rcand != null) && cell.rcand.length === 1 && !cell.digit && !cell.cand[cell.rcand[0]] && !cell.mask[cell.rcand[0]]) {
          this.found.push([cell, cell.rcand[0]]);
          this.grid.mark([cell], [cell.rcand[0]], 'green');
          cellList.push("<span class=\"cellRef\">" + cell.id + "</span>");
        }
      }
      if (this.found.length) {
        one = cellList.length === 1;
        text = "Cell" + (one ? '' : 's') + " " + (cellList.join(', ')) + " ha" + (one ? 's' : 've') + " only one candidate remaining.";
        this.msgid = this.grid.message(text);
        return true;
      }
      return false;
    };
    NakedSingles.prototype.apply = function() {
      var cell, found, k, _i, _len, _ref;
      this.grid.removeMarks();
      this.grid.removeMessage(this.msgid);
      found = this.found;
      this.found = [];
      for (_i = 0, _len = found.length; _i < _len; _i++) {
        _ref = found[_i], cell = _ref[0], k = _ref[1];
        if (cell.rcand.length === 1) {
          try {
            cell.set(k, 'solver');
          } catch (_e) {}
        }
      }
    };
    NakedSingles.prototype.discard = function() {
      var cell, found, _i, _len;
      this.grid.removeMarks();
      this.grid.removeMessage(this.msgid);
      found = this.found;
      this.found = [];
      for (_i = 0, _len = found.length; _i < _len; _i++) {
        cell = found[_i];
        this.cand.push(cell);
      }
    };
    return NakedSingles;
  })();
  HiddenSingles = (function() {
    function HiddenSingles(solver) {
      this.solver = solver;
      this.grid = this.solver.grid;
      this.cand = [];
      this.found = null;
      this.enabled = true;
      this.sbs = true;
    }
    HiddenSingles.prototype.enable = function() {
      return this.enabled = true;
    };
    HiddenSingles.prototype.disable = function() {
      return this.enabled = false;
    };
    HiddenSingles.prototype.findall = function() {
      var cand, s;
      s = this.grid.s;
      cand = this.cand;
      return this.grid.houses.iter(function(house) {
        var cell, count, empty, k, last, _i, _len;
        empty = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = house.length; _i < _len; _i++) {
            cell = house[_i];
            if (!cell.digit) {
              _results.push(cell);
            }
          }
          return _results;
        })();
        for (k = 1; 1 <= s ? k <= s : k >= s; 1 <= s ? k++ : k--) {
          count = 0;
          last = false;
          for (_i = 0, _len = empty.length; _i < _len; _i++) {
            cell = empty[_i];
            if (!(cell.cand[k] || cell.mask[k])) {
              count += 1;
              last = cell;
            }
          }
          if (count === 1) {
            cand.push([last, k, house]);
          }
        }
      });
    };
    HiddenSingles.prototype.set = function() {
      var cand, cell, k, result, _i, _len, _ref;
      this.cand = [];
      this.findall();
      cand = this.cand;
      result = false;
      for (_i = 0, _len = cand.length; _i < _len; _i++) {
        _ref = cand[_i], cell = _ref[0], k = _ref[1];
        try {
          cell.set(k, 'solver');
          result = true;
        } catch (_e) {}
      }
      return result;
    };
    HiddenSingles.prototype.search = function() {
      var cell, house, k, text, _ref;
      if (this.found != null) {
        throw new Error('New search while old results are not used!');
      }
      this.cand = [];
      this.findall();
      if (!this.cand.length) {
        return false;
      }
      this.found = this.cand[0];
      _ref = this.found, cell = _ref[0], k = _ref[1], house = _ref[2];
      this.grid.mark([cell], [k], 'green');
      this.grid.markHouse(house);
      text = "The only one candidate " + k + " remaining in " + house.type + "-" + house.s;
      this.msgid = this.grid.message(text);
      return true;
    };
    HiddenSingles.prototype.apply = function() {
      var cell, k, _ref;
      this.grid.removeMarks();
      this.grid.removeHouseMarks();
      this.grid.removeMessage(this.msgid);
      _ref = this.found, cell = _ref[0], k = _ref[1];
      this.found = null;
      try {
        cell.set(k, 'solver');
      } catch (_e) {}
    };
    HiddenSingles.prototype.discard = function() {
      this.grid.removeMarks();
      this.grid.removeHouseMarks();
      this.grid.removeMessage(this.msgid);
      this.found = null;
      this.cand = [];
    };
    return HiddenSingles;
  })();
  NakedSubsets = (function() {
    function NakedSubsets(solver) {
      this.solver = solver;
      this.grid = this.solver.grid;
      this.found = null;
      this.enabled = true;
      this.sbs = true;
    }
    NakedSubsets.prototype.enable = function() {
      return this.enabled = true;
    };
    NakedSubsets.prototype.disable = function() {
      return this.enabled = false;
    };
    NakedSubsets.prototype.commonHouses = function(cells) {
      var cell, obj, t, _, _i, _len, _results;
      t = {};
      for (_i = 0, _len = cells.length; _i < _len; _i++) {
        cell = cells[_i];
        cell.houses.iter(function(house) {
          if (t[house.id] != null) {
            return t[house.id][0] += 1;
          } else {
            return t[house.id] = [1, house];
          }
        });
      }
      _results = [];
      for (_ in t) {
        obj = t[_];
        if (obj[0] === cells.length) {
          _results.push(obj[1]);
        }
      }
      return _results;
    };
    NakedSubsets.prototype._isNakedSubset = function(a) {
      var cand, cell, k, _i, _j, _len, _len2, _ref;
      cand = [];
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        cell = a[_i];
        _ref = cell.rcand;
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          k = _ref[_j];
          if (__indexOf.call(cand, k) < 0) {
            cand.push(k);
          }
        }
      }
      if (cand.length === a.length) {
        return {
          digits: cand,
          cells: a
        };
      }
      return null;
    };
    NakedSubsets.prototype.findNakedSubsets = function() {
      var isNS, ns, s;
      ns = [];
      isNS = this._isNakedSubset;
      s = this.grid.s;
      this.grid.houses.iter(function(house) {
        var cell, i, j, k, prob, r, t, _ref, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
        if (s - house.filled < 4) {
          return;
        }
        prob = (function() {
          var _i, _len, _ref, _results;
          _results = [];
          for (_i = 0, _len = house.length; _i < _len; _i++) {
            cell = house[_i];
            if (!cell.digit && !(cell["solverNS" + house.id] != null) && (2 <= (_ref = cell.rcand.length) && _ref <= 4)) {
              _results.push(cell);
            }
          }
          return _results;
        })();
        if (!(2 <= prob.length)) {
          return;
        }
        for (i = 0, _ref = prob.length; i < _ref; i += 1) {
          for (j = _ref2 = i + 1, _ref3 = prob.length; j < _ref3; j += 1) {
            r = isNS([prob[i], prob[j]]);
            if (r != null) {
              r.house = house;
              ns.push(r);
            }
          }
        }
        for (i = 0, _ref4 = prob.length; i < _ref4; i += 1) {
          for (j = _ref5 = i + 1, _ref6 = prob.length; j < _ref6; j += 1) {
            for (k = _ref7 = j + 1, _ref8 = prob.length; k < _ref8; k += 1) {
              r = isNS([prob[i], prob[j], prob[k]]);
              if (r != null) {
                r.house = house;
                ns.push(r);
              }
            }
          }
        }
        for (i = 0, _ref9 = prob.length; i < _ref9; i += 1) {
          for (j = _ref10 = i + 1, _ref11 = prob.length; j < _ref11; j += 1) {
            for (k = _ref12 = j + 1, _ref13 = prob.length; k < _ref13; k += 1) {
              for (t = _ref14 = k + 1, _ref15 = prob.length; t < _ref15; t += 1) {
                r = isNS([prob[i], prob[j], prob[k], prob[t]]);
                if (r != null) {
                  r.house = house;
                  ns.push(r);
                }
              }
            }
          }
        }
      });
      return ns;
    };
    NakedSubsets.prototype.set = function() {
      var cell, house, houses, mask, maskid, ns, ok, q, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _m, _ref, _ref2;
      ns = this.findNakedSubsets();
      for (_i = 0, _len = ns.length; _i < _len; _i++) {
        q = ns[_i];
        ok = true;
        _ref = q.cells;
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          cell = _ref[_j];
          if (cell.digit || (cell.solverNS != null)) {
            ok = false;
          }
        }
        if (!ok) {
          continue;
        }
        houses = this.commonHouses(q.cells);
        mask = [];
        for (_k = 0, _len3 = houses.length; _k < _len3; _k++) {
          house = houses[_k];
          for (_l = 0, _len4 = house.length; _l < _len4; _l++) {
            cell = house[_l];
            if (!cell.digit && __indexOf.call(q.cells, cell) < 0 && __indexOf.call(mask, cell) < 0) {
              mask.push(cell);
            }
          }
        }
        if (!mask.length) {
          continue;
        }
        maskid = this.grid.mask(mask, q.digits, 'solver');
        this.grid._history.add({
          action: 'solverNS',
          cells: q.cells,
          maskid: maskid,
          id: "_solverNS_" + maskid,
          houseid: q.house.id
        });
        _ref2 = q.cells;
        for (_m = 0, _len5 = _ref2.length; _m < _len5; _m++) {
          cell = _ref2[_m];
          cell["solverNS" + q.house.id] = true;
        }
        return true;
      }
      return false;
    };
    NakedSubsets.prototype.search = function() {
      var cell, d, h, house, houses, mask, ns, ok, q, realMasks, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _ref, _ref2;
      if (this.found != null) {
        throw new Error('New search while old results are not used!');
      }
      ns = this.findNakedSubsets();
      for (_i = 0, _len = ns.length; _i < _len; _i++) {
        q = ns[_i];
        ok = true;
        _ref = q.cells;
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          cell = _ref[_j];
          if (cell.digit || (cell.solverNS != null)) {
            ok = false;
          }
        }
        if (!ok) {
          continue;
        }
        houses = this.commonHouses(q.cells);
        mask = [];
        for (_k = 0, _len3 = houses.length; _k < _len3; _k++) {
          house = houses[_k];
          for (_l = 0, _len4 = house.length; _l < _len4; _l++) {
            cell = house[_l];
            if (!cell.digit && __indexOf.call(q.cells, cell) < 0 && __indexOf.call(mask, cell) < 0) {
              mask.push(cell);
            }
          }
        }
        realMasks = 0;
        for (_m = 0, _len5 = mask.length; _m < _len5; _m++) {
          cell = mask[_m];
          _ref2 = q.digits;
          for (_n = 0, _len6 = _ref2.length; _n < _len6; _n++) {
            d = _ref2[_n];
            if (!cell.cand[d] && !cell.mask[d]) {
              realMasks += 1;
            }
          }
        }
        if (!realMasks) {
          continue;
        }
        for (_o = 0, _len7 = houses.length; _o < _len7; _o++) {
          h = houses[_o];
          this.grid.markHouse(h);
        }
        this.found = [mask, q];
        this.grid.mark(q.cells, q.digits, 'green');
        this.grid.mark(mask, q.digits, 'red');
        this.msgid = this.grid.message("Naked subset in " + (((function() {
          var _len8, _p, _ref3, _results;
          _ref3 = q.cells;
          _results = [];
          for (_p = 0, _len8 = _ref3.length; _p < _len8; _p++) {
            cell = _ref3[_p];
            _results.push(cell.id);
          }
          return _results;
        })()).join(', ')));
        return true;
      }
      return false;
    };
    NakedSubsets.prototype.apply = function() {
      var cell, mask, maskid, q, _i, _len, _ref, _ref2;
      this.grid.removeMarks();
      this.grid.removeHouseMarks();
      this.grid.removeMessage(this.msgid);
      _ref = this.found, mask = _ref[0], q = _ref[1];
      this.found = null;
      maskid = this.grid.mask(mask, q.digits, 'solver');
      this.grid._history.add({
        action: 'solverNS',
        cells: q.cells,
        maskid: maskid,
        id: "_solverNS_" + maskid,
        houseid: q.house.id
      });
      _ref2 = q.cells;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        cell = _ref2[_i];
        cell["solverNS" + q.house.id] = true;
      }
    };
    NakedSubsets.prototype.discard = function() {
      this.grid.removeMarks();
      this.grid.removeHouseMarks();
      this.grid.removeMessage(this.msgid);
      this.found = null;
    };
    return NakedSubsets;
  })();
  SudokuSolver = (function() {
    __extends(SudokuSolver, EventEmitter);
    function SudokuSolver(opts) {
      var defs, _ref;
      if (!(this instanceof SudokuSolver)) {
        return new SudokuSolver(opts);
      }
      defs = {
        solve: false,
        gncSpeed: 50
      };
      extend(defs, opts);
      this._timers = {
        gnc: false
      };
      this.grid = (_ref = defs.grid) != null ? _ref : new SudokuGrid;
      if (!(this.grid instanceof SudokuGrid)) {
        throw new Error('Grid is not of class SudokuGrid');
      }
      this.solve = defs.solve;
      this.sbs = true;
      this.algo = [["NakedSingles", new NakedSingles(this)], ["HiddenSingles", new HiddenSingles(this)], ["NakedSubsets", new NakedSubsets(this)]];
      this.state = -1;
      this.gncSpeed = defs.gncSpeed;
      this._gnc = false;
      this.history = new DLSet;
      this.grid.message('Enter your starting digits, solution will appear on the fly.');
      this.grid.on('loadMap', __bind(function() {
        var s;
        if (this._gnc) {
          this.gncStop();
        }
        this.history = new DLSet;
        if (this.state >= 0) {
          s = this.state;
          this.state = -1;
          console.log("    discarding " + this.algo[s][0] + " because new sudoku loaded");
          this.algo[s][1].discard();
          return this.emit('solve');
        }
      }, this));
      this.grid.on('change', __bind(function() {
        return this._change();
      }, this));
      this.grid.on('unset', __bind(function(cell) {
        return this._unset(cell);
      }, this));
      this.grid.on('delHouse', __bind(function(house) {
        return this._delHouse(house);
      }, this));
      this.grid.on('error', __bind(function(cell) {
        var s;
        if (this.state >= 0) {
          s = this.state;
          this.state = -1;
          console.log("    discarding " + this.algo[s][0] + " because of an error in " + cell.id);
          this.algo[s][1].discard();
          return this.emit('solve');
        }
      }, this));
    }
    SudokuSolver.prototype.commonHouses = function(cells) {
      var cell, obj, t, _, _i, _len, _results;
      t = {};
      for (_i = 0, _len = cells.length; _i < _len; _i++) {
        cell = cells[_i];
        cell.houses.iter(function(house) {
          if (t[house.id] != null) {
            return t[house.id][0] += 1;
          } else {
            return t[house.id] = [1, house];
          }
        });
      }
      _results = [];
      for (_ in t) {
        obj = t[_];
        if (obj[0] === cells.length) {
          _results.push(obj[1]);
        }
      }
      return _results;
    };
    SudokuSolver.prototype._isNakedSubset = function(a) {
      var cand, cell, k, _i, _j, _len, _len2, _ref;
      cand = [];
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        cell = a[_i];
        _ref = cell.rcand;
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          k = _ref[_j];
          if (__indexOf.call(cand, k) < 0) {
            cand.push(k);
          }
        }
      }
      if (cand.length === a.length) {
        return {
          digits: cand,
          cells: a
        };
      }
      return null;
    };
    SudokuSolver.prototype.findNakedSubsets = function() {
      var isNS, ns, s;
      ns = [];
      isNS = this._isNakedSubset;
      s = this.grid.s;
      this.grid.houses.iter(function(house) {
        var cell, i, j, k, prob, r, t, _ref, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
        if (s - house.filled < 4) {
          return;
        }
        prob = (function() {
          var _i, _len, _ref, _results;
          _results = [];
          for (_i = 0, _len = house.length; _i < _len; _i++) {
            cell = house[_i];
            if (!cell.digit && !(cell["solverNS" + house.id] != null) && (2 <= (_ref = cell.rcand.length) && _ref <= 4)) {
              _results.push(cell);
            }
          }
          return _results;
        })();
        if (!(2 <= prob.length)) {
          return;
        }
        for (i = 0, _ref = prob.length; i < _ref; i += 1) {
          for (j = _ref2 = i + 1, _ref3 = prob.length; j < _ref3; j += 1) {
            r = isNS([prob[i], prob[j]]);
            if (r != null) {
              r.house = house;
              ns.push(r);
              return false;
            }
          }
        }
        for (i = 0, _ref4 = prob.length; i < _ref4; i += 1) {
          for (j = _ref5 = i + 1, _ref6 = prob.length; j < _ref6; j += 1) {
            for (k = _ref7 = j + 1, _ref8 = prob.length; k < _ref8; k += 1) {
              r = isNS([prob[i], prob[j], prob[k]]);
              if (r != null) {
                r.house = house;
                ns.push(r);
                return false;
              }
            }
          }
        }
        for (i = 0, _ref9 = prob.length; i < _ref9; i += 1) {
          for (j = _ref10 = i + 1, _ref11 = prob.length; j < _ref11; j += 1) {
            for (k = _ref12 = j + 1, _ref13 = prob.length; k < _ref13; k += 1) {
              for (t = _ref14 = k + 1, _ref15 = prob.length; t < _ref15; t += 1) {
                r = isNS([prob[i], prob[j], prob[k], prob[t]]);
                if (r != null) {
                  r.house = house;
                  ns.push(r);
                  return false;
                }
              }
            }
          }
        }
      });
      return ns;
    };
    SudokuSolver.prototype.findHiddenSingles = function() {
      var hs, s;
      hs = [];
      s = this.grid.s;
      this.grid.houses.iter(function(house) {
        var cell, count, empty, k, last, _i, _len;
        empty = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = house.length; _i < _len; _i++) {
            cell = house[_i];
            if (!cell.digit) {
              _results.push(cell);
            }
          }
          return _results;
        })();
        for (k = 1; 1 <= s ? k <= s : k >= s; 1 <= s ? k++ : k--) {
          count = 0;
          last = false;
          for (_i = 0, _len = empty.length; _i < _len; _i++) {
            cell = empty[_i];
            if (!(cell.cand[k] || cell.mask[k])) {
              count += 1;
              last = cell;
            }
          }
          if (count === 1) {
            hs.push([last, k, house]);
          }
        }
      });
      return hs;
    };
    SudokuSolver.prototype.step = function() {
      var a, i, name, s, _len, _ref, _ref2;
      if (this.state >= 0) {
        console.log("    Got step request");
        s = this.state;
        this.state = -1;
        this.algo[s][1].apply();
        if (!this.solve) {
          this.emit('solve');
        }
        return;
      }
      if (this.grid.errors || !this.solve) {
        return this.emit('solve');
      }
      console.log("Searching for solutions...");
      _ref = this.algo;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        _ref2 = _ref[i], name = _ref2[0], a = _ref2[1];
        if (!a.enabled) {
          continue;
        }
        if (this.sbs && a.sbs) {
          console.log("Trying " + name + " (step by step)");
          if (a.search()) {
            console.log("    " + name + " succeed");
            this.state = i;
            this.emit('waitStep');
            return;
          }
        } else {
          console.log("Trying " + name + " (fast)");
          if (a.set()) {
            console.log("    " + name + " succeed");
            return;
          }
        }
      }
      console.log("Nothing left to do");
      this.emit('solve');
    };
    SudokuSolver.prototype.technique = function(technique, sbs, enabled) {
      var alg, i, _len, _ref;
      _ref = this.algo;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        alg = _ref[i];
        if (alg[0] === technique) {
          break;
        }
      }
      if (i === solver.algo.length) {
        return false;
      }
      if (sbs) {
        return alg[1].sbs = enabled;
      } else {
        if (enabled) {
          if (!alg[1].enabled) {
            alg[1].enable();
            return this._change();
          }
        } else {
          if (alg[1].enabled) {
            return alg[1].disable();
          }
        }
      }
    };
    SudokuSolver.prototype._change = function() {
      var cell, house, houses, hs, k, mask, maskid, ns, ok, q, set, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _ref, _ref2, _ref3;
      if (this.grid.errors) {
        return this.emit('solve');
      }
      if (this.state >= 0 || !this.solve) {
        return;
      }
      console.log("Grid updated");
      this.step();
      return;
      if (this._nextStepSet.length) {
        return;
      }
      if (this.grid.errors) {
        return this.emit('solve');
      }
      this.step();
      if (!this._nextStepSet.length) {
        this.emit('solve');
      }
      return;
      set = 0;
      ns = this._nakedSingles;
      this._nakedSingles = [];
      for (_i = 0, _len = ns.length; _i < _len; _i++) {
        cell = ns[_i];
        if (cell.rcand.length !== 1 || cell.digit) {
          continue;
        }
        try {
          cell.set(cell.rcand[0], 'solver');
          set += 1;
        } catch (_e) {}
      }
      if (set) {
        return;
      }
      hs = this.findHiddenSingles();
      for (_j = 0, _len2 = hs.length; _j < _len2; _j++) {
        _ref = hs[_j], cell = _ref[0], k = _ref[1];
        if (cell.digit) {
          continue;
        }
        try {
          cell.set(k, 'solver');
          set += 1;
        } catch (_e) {}
      }
      if (set) {
        return;
      }
      ns = this.findNakedSubsets();
      for (_k = 0, _len3 = ns.length; _k < _len3; _k++) {
        q = ns[_k];
        ok = true;
        _ref2 = q.cells;
        for (_l = 0, _len4 = _ref2.length; _l < _len4; _l++) {
          cell = _ref2[_l];
          if (cell.digit || (cell.solverNS != null)) {
            ok = false;
          }
        }
        if (!ok) {
          continue;
        }
        houses = this.commonHouses(q.cells);
        mask = [];
        for (_m = 0, _len5 = houses.length; _m < _len5; _m++) {
          house = houses[_m];
          for (_n = 0, _len6 = house.length; _n < _len6; _n++) {
            cell = house[_n];
            if (!cell.digit && __indexOf.call(q.cells, cell) < 0 && __indexOf.call(mask, cell) < 0) {
              mask.push(cell);
            }
          }
        }
        set += 1;
        maskid = this.grid.mask(mask, q.digits, 'solver');
        this.grid._history.add({
          action: 'solverNS',
          cells: q.cells,
          maskid: maskid,
          id: "_solverNS_" + maskid,
          houseid: q.house.id
        });
        _ref3 = q.cells;
        for (_o = 0, _len7 = _ref3.length; _o < _len7; _o++) {
          cell = _ref3[_o];
          cell["solverNS" + q.house.id] = true;
        }
      }
      if (set) {
        return;
      }
      return this.emit('solve');
    };
    SudokuSolver.prototype._unset = function(deadCell) {
      var cell, it, rec, s, _i, _len, _ref;
      if (this.state >= 0) {
        s = this.state;
        this.state = -1;
        console.log("    discarding " + this.algo[s][0] + " because " + deadCell.id + " lost its digit");
        this.algo[s][1].discard();
        this.emit('solve');
      }
      it = {
        next: this.grid._history.head
      };
      while (true) {
        it = it.next;
        if (!it) {
          break;
        }
        if (it.dead != null) {
          continue;
        }
        rec = it.e;
        if (rec.action === 'set' && rec.cell === deadCell) {
          break;
        }
        if (rec.action === 'set' && rec.cell.source === 'solver') {
          rec.cell.unset('solver');
        }
        if (rec.action === 'solverNS') {
          _ref = rec.cells;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            cell = _ref[_i];
            delete cell["solverNS" + rec.houseid];
          }
          this.grid._history.remove("_solverNS_" + rec.maskid);
          this.grid.unmask(rec.maskid, 'solver');
        }
      }
    };
    SudokuSolver.prototype._delHouse = function(house) {
      var it, rec;
      it = this.grid._history.head;
      while (it) {
        rec = it.e;
        if (rec.action === 'addHouse' && rec.house === house) {
          break;
        }
        if (rec.action === 'set' && rec.cell.source === 'solver') {
          rec.cell.unset('solver');
        }
        it = it.next;
      }
    };
    SudokuSolver.prototype.gncStart = function() {
      if (this._gnc) {
        return this;
      }
      this._gnc = true;
      this._gncSCell = this.grid.headCell;
      this._gncSDigit = 1;
      this.emit('gncStart');
      return this._gncIter();
    };
    SudokuSolver.prototype.gncStop = function() {
      if (!this._gnc) {
        return this;
      }
      this._gnc = false;
      return this.emit('gncStop');
    };
    SudokuSolver.prototype.gncToggle = function() {
      if (this._gnc) {
        return this.gncStop();
      } else {
        return this.gncStart();
      }
    };
    SudokuSolver.prototype.gncReset = function() {
      var cell, _results;
      cell = this.grid.headCell;
      _results = [];
      while (cell) {
        if (cell.digit && cell.source === 'gnc') {
          cell.unset('gnc');
        }
        _results.push(cell = cell.next);
      }
      return _results;
    };
    SudokuSolver.prototype._gncIter = function(stepback) {
      var cell, k, _ref, _ref2;
      if (stepback == null) {
        stepback = false;
      }
      if (!this._gnc) {
        return;
      }
      if (stepback || this.grid.errors) {
        cell = this.grid.tailCell;
        while (cell) {
          if (cell.digit && cell.source === 'gnc') {
            break;
          }
          cell = cell.prev;
        }
        if (!cell) {
          return this.gncStop();
        }
        this._gncSCell = cell;
        this._gncSDigit = cell.digit + 1;
        cell.unset('gnc');
      } else {
        if (this.grid.filled === this.grid.total) {
          return this.gncStop();
        }
        cell = this._gncSCell;
        while (cell) {
          if (!cell.digit) {
            for (k = _ref = this._gncSDigit, _ref2 = this.grid.s; k <= _ref2; k += 1) {
              if (!(cell.cand[k] || cell.mask[k])) {
                break;
              }
            }
            if (k !== this.grid.s + 1) {
              break;
            }
            this._gncSDigit = 1;
            return this._gncIter(true);
          }
          cell = cell.next;
        }
        if (!cell) {
          return this.gncStop();
        }
        cell.set(k, 'gnc');
        this._gncSCell = cell.next;
        this._gncSDigit = 1;
      }
      return this.once('solve', __bind(function() {
        return this._timers.gnc = setTimeout((__bind(function() {
          this._timers.gnc = false;
          return this._gncIter();
        }, this)), this.gncSpeed);
      }, this));
    };
    return SudokuSolver;
  })();
  this.SudokuSolver = SudokuSolver;
  HouseList = (function() {
    __extends(HouseList, DLSet);
    function HouseList() {
      HouseList.__super__.constructor.apply(this, arguments);
    }
    HouseList.prototype.add = function(house) {
      var ref, _name, _ref;
      ref = HouseList.__super__.add.call(this, house);
      if ((_ref = this[_name = house.type]) == null) {
        this[_name] = new DLList;
      }
      ref.tw = this[house.type].add(house);
      return this;
    };
    HouseList.prototype.remove = function(house) {
      var ref;
      ref = HouseList.__super__.remove.call(this, house);
      if (!ref) {
        return this;
      }
      this[house.type].remove(ref.tw);
      return this;
    };
    return HouseList;
  })();
  SudokuCell = (function() {
    __extends(SudokuCell, EventEmitter);
    function SudokuCell(opts) {
      this.digit = 0;
      this.source = '';
      this.houses = new HouseList;
      this.cand = [];
      this.mask = [];
      this.colors = null;
      this.rcand = [];
      this.s = 9;
      this.touched = false;
      this.err = false;
      extend(this, opts);
      this.cand.fill([1 + this.s], 0);
      this.mask.fill([1 + this.s], 0);
      this.id = this.coord();
    }
    SudokuCell.prototype.coord = function() {
      return "" + (_aa(this.i)) + (1 + this.j);
    };
    SudokuCell.prototype.coordx = function() {
      return this._aa(this.i);
    };
    SudokuCell.prototype.coordy = function() {
      return "" + (1 + this.j);
    };
    SudokuCell.prototype.setUser = function() {
      var oldsource, _ref;
      if (!this.digit) {
        throw new Error('No digit in the cell');
      }
      if (this.source === 'user') {
        return this;
      }
      _ref = [this.source, 'user'], oldsource = _ref[0], this.source = _ref[1];
      return this.emit('chsrc', oldsource);
    };
    SudokuCell.prototype.set = function(k, source, force) {
      var t;
      if (force == null) {
        force = false;
      }
      if (!((1 <= k && k <= this.s)) || Math.ceil(k !== k)) {
        throw new Error("Invalid digit: " + k);
      }
      if (this.digit) {
        throw new Error("Cell already has digit");
      }
      if (!force && (this.cand[k] || this.mask[k])) {
        throw new Error("Cann't set that digit");
      }
      this.digit = +k;
      this.source = source;
      t = this.grid._touched;
      this.houses.iter(function(house) {
        var sibling, _i, _len;
        for (_i = 0, _len = house.length; _i < _len; _i++) {
          sibling = house[_i];
          sibling.cand[k] += 1;
          if (!sibling.touched) {
            sibling.touched = true;
            t.push(sibling);
          }
        }
        return house.filled += 1;
      });
      return this.emit('set');
    };
    SudokuCell.prototype.unset = function(source) {
      var k, t;
      if (!this.digit) {
        throw new Error("No digit in the cell");
      }
      if (this.source !== source) {
        throw new Error("Access denied");
      }
      k = this.digit;
      this.digit = 0;
      t = this.grid._touched;
      this.houses.iter(function(house) {
        var sibling, _i, _len;
        for (_i = 0, _len = house.length; _i < _len; _i++) {
          sibling = house[_i];
          sibling.cand[k] -= 1;
          if (!sibling.touched) {
            sibling.touched = true;
            t.push(sibling);
          }
        }
        return house.filled -= 1;
      });
      return this.emit('unset');
    };
    SudokuCell.prototype.step = function(x, y) {
      var cell;
      cell = this;
      if (x >= 0) {
        while ((x -= 1) >= 0) {
          cell = cell.bottom;
        }
      } else {
        while ((x += 1) <= 0) {
          cell = cell.top;
        }
      }
      if (y >= 0) {
        while ((y -= 1) >= 0) {
          cell = cell.right;
        }
      } else {
        while ((y += 1) <= 0) {
          cell = cell.left;
        }
      }
      return cell;
    };
    return SudokuCell;
  })();
  SudokuGrid = (function() {
    __extends(SudokuGrid, EventEmitter);
    function SudokuGrid(opts) {
      var defs;
      if (!(this instanceof SudokuGrid)) {
        return new SudokuGrid(opts);
      }
      defs = {};
      extend(defs, opts);
      this.headCell = this.tailCell = false;
      this._messages = [];
      this._ch = false;
    }
    SudokuGrid.prototype._changed = function() {
      if (this._ch) {
        return this;
      }
      this._ch = true;
      process.nextTick(__bind(function() {
        var cell, err, i, k, newcand, s, tcopy, updated, _i, _j, _len, _len2, _len3, _ref;
        this._ch = false;
        if (!this.headCell) {
          return;
        }
        tcopy = this._touched;
        this._touched = [];
        for (_i = 0, _len = tcopy.length; _i < _len; _i++) {
          cell = tcopy[_i];
          cell.touched = false;
        }
        for (_j = 0, _len2 = tcopy.length; _j < _len2; _j++) {
          cell = tcopy[_j];
          updated = false;
          if (cell.digit) {
            cell.rcand = [];
            err = cell.cand[cell.digit] !== cell.houses.length;
          } else {
            s = this.s;
            newcand = (function() {
              var _results;
              _results = [];
              for (k = 1; k <= s; k += 1) {
                if (cell.cand[k] + cell.mask[k] === 0) {
                  _results.push(k);
                }
              }
              return _results;
            })();
            updated = newcand.length !== cell.rcand.length;
            if (!updated) {
              _ref = cell.rcand;
              for (i = 0, _len3 = _ref.length; i < _len3; i++) {
                k = _ref[i];
                if (k !== newcand[i]) {
                  updated = true;
                }
              }
            }
            if (updated) {
              cell.rcand = newcand;
            }
            err = cell.rcand.length === 0;
          }
          if (err && !cell.err) {
            cell.err = true;
            this.errors += 1;
            this.emit('error', cell);
          } else if (!err && cell.err) {
            cell.err = false;
            this.errors -= 1;
            this.emit('fix', cell);
          }
          if (updated) {
            this.emit('touch', cell);
          }
        }
        return this.emit('change');
      }, this));
      return this;
    };
    SudokuGrid.prototype.isCell = function(cell) {
      return this.headCell && cell instanceof SudokuCell && cell.grid === this;
    };
    SudokuGrid.prototype.undo = function() {
      var it, rec;
      it = this._history.head;
      while (it) {
        rec = it.e;
        if (rec.action === 'addHouse') {
          this.delHouse(rec.house);
          break;
        }
        if (rec.action === 'set' && rec.cell.source === 'user') {
          rec.cell.unset('user');
          break;
        }
        it = it.next;
      }
    };
    SudokuGrid.prototype.clear = function() {
      var cell;
      if (!this.headCell) {
        throw new Error('No map loaded');
      }
      cell = this.headCell;
      while (cell) {
        if (cell.digit) {
          cell.unset(cell.source);
        }
        cell = cell.next;
      }
      return this;
    };
    SudokuGrid.prototype.unloadMap = function(complete) {
      var i, t, _i, _len, _ref;
      if (complete == null) {
        complete = true;
      }
      for (t in this.timers) {
        if (this.timers[t]) {
          clearTimeout(this.timers[t]);
          this.timers[t] = false;
        }
      }
      _ref = ['w', 'h', 'boxes', 's', 'mi', 'mj', 'grids', '_history', 'houses', 'errors', 'filled', 'ufilled', 'total', '_touched', '_marks', '_houseMarks', 'agrid', 'gr'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        delete this[i];
      }
      this.headCell = this.tailCell = false;
      return this.emit('unloadMap');
    };
    SudokuGrid.prototype.messageID = 0;
    SudokuGrid.prototype.message = function(html) {
      var id;
      id = SudokuGrid.prototype.messageID;
      SudokuGrid.prototype.messageID += 1;
      this._messages.push([id, html]);
      this.emit('message', html);
      return id;
    };
    SudokuGrid.prototype.removeMessage = function(id) {
      var e, i, pos, _len, _ref, _ref2;
      _ref = this._messages;
      for (pos = 0, _len = _ref.length; pos < _len; pos++) {
        e = _ref[pos];
        if (e[0] === id) {
          break;
        }
      }
      if (pos >= this._messages.length) {
        return;
      }
      for (i = pos, _ref2 = this._messages.length - 1; i < _ref2; i += 1) {
        this._messages[i] = this._messages[i + 1];
      }
      this._messages.pop();
      if (pos && pos === this._messages.length) {
        return this.emit('message', this._messages[this._messages.length - 1][1]);
      }
    };
    SudokuGrid.prototype.markHouse = function(house) {
      this._houseMarks.push(house);
      return this.emit('markHouse', house, Math.min(3, this._houseMarks.length));
    };
    SudokuGrid.prototype.removeHouseMarks = function() {
      var hmarks, house, _i, _len, _results;
      hmarks = this._houseMarks;
      this._houseMarks = [];
      _results = [];
      for (_i = 0, _len = hmarks.length; _i < _len; _i++) {
        house = hmarks[_i];
        _results.push(this.emit('unmarkHouse', house));
      }
      return _results;
    };
    SudokuGrid.prototype.mark = function(cells, digits, color) {
      var cell, d, _i, _j, _len, _len2, _ref;
      if (color == null) {
        color = 'green';
      }
      for (_i = 0, _len = cells.length; _i < _len; _i++) {
        cell = cells[_i];
        this._marks.push(cell);
        if ((_ref = cell.colors) == null) {
          cell.colors = {};
        }
        for (_j = 0, _len2 = digits.length; _j < _len2; _j++) {
          d = digits[_j];
          cell.colors[d] = color;
        }
      }
      return this.emit('mark', cells);
    };
    SudokuGrid.prototype.removeMarks = function() {
      var cell, cells, _i, _len;
      cells = this._marks;
      this._marks = [];
      for (_i = 0, _len = cells.length; _i < _len; _i++) {
        cell = cells[_i];
        cell.colors = null;
      }
      return this.emit('unmark', cells);
    };
    SudokuGrid.prototype.maskID = 0;
    SudokuGrid.prototype.mask = function(cells, digits, source) {
      var cell, d, id, rec, _i, _j, _len, _len2;
      id = SudokuGrid.prototype.maskID;
      SudokuGrid.prototype.maskID += 1;
      rec = {
        action: 'mask',
        id: "_mask_" + id,
        cells: [],
        source: source
      };
      for (_i = 0, _len = cells.length; _i < _len; _i++) {
        cell = cells[_i];
        rec.cells.push(cell);
        for (_j = 0, _len2 = digits.length; _j < _len2; _j++) {
          d = digits[_j];
          cell.mask[d] += 1;
        }
        if (!cell.touched) {
          cell.touched = true;
          this._touched.push(cell);
        }
      }
      rec.digits = (function() {
        var _k, _len3, _results;
        _results = [];
        for (_k = 0, _len3 = digits.length; _k < _len3; _k++) {
          d = digits[_k];
          _results.push(d);
        }
        return _results;
      })();
      this._history.add(rec);
      this._changed();
      return id;
    };
    SudokuGrid.prototype.unmask = function(id, source) {
      var cell, d, rec, _i, _j, _len, _len2, _ref, _ref2;
      rec = this._history["_mask_" + id].e;
      if (rec == null) {
        throw new Error('No such mask');
      }
      if (rec.source !== source) {
        throw new Error('Access denied');
      }
      _ref = rec.cells;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cell = _ref[_i];
        _ref2 = rec.digits;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          d = _ref2[_j];
          cell.mask[d] -= 1;
          if (!cell.touched) {
            cell.touched = true;
            this._touched.push(cell);
          }
        }
      }
      this._history.remove("_mask_" + id);
      return this._changed();
    };
    SudokuGrid.prototype._cellSet = function() {
      this.grid.filled += 1;
      if (this.source === 'user') {
        this.grid.ufilled += 1;
      }
      this.grid._history.add({
        action: 'set',
        cell: this,
        id: "_set_" + this.id
      });
      this.grid.emit('set', this);
      return this.grid._changed();
    };
    SudokuGrid.prototype._cellUnset = function() {
      this.grid.filled -= 1;
      if (this.source === 'user') {
        this.grid.ufilled -= 1;
      }
      this.grid.emit('unset', this);
      this.grid._history.remove("_set_" + this.id);
      return this.grid._changed();
    };
    SudokuGrid.prototype._cellChsrc = function(old) {
      if (this.source === 'user') {
        this.grid.ufilled += 1;
      }
      if (old === 'user') {
        this.grid.ufilled -= 1;
      }
      this.grid.emit('cellChsrc', this, old);
      return this.grid._changed();
    };
    SudokuGrid.prototype.saveMap = function() {
      var defgrid, grid, h, map, _i, _len, _ref;
      map = [];
      if (this.h !== 3 || this.w !== 3) {
        map.push("" + this.h + "x" + this.w);
      }
      defgrid = this.grids.length === 1 && this.grids[0].pos.i === 0 && this.grids[0].pos.j === 0;
      if (!defgrid) {
        _ref = this.grids;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          grid = _ref[_i];
          map.push("" + grid.pos.i + ":" + grid.pos.j);
        }
      }
      h = [];
      this.houses.iter(function(house) {
        var _ref2;
        if ((_ref2 = house.type) === 'diag1' || _ref2 === 'diag2') {
          return h.push("h=" + house.type + ":" + house.s);
        }
      });
      while (h.length) {
        map.push(h.pop());
      }
      if (this.symbtxt !== false) {
        map.push("symb=" + this.symbtxt);
      }
      return map.join(',');
    };
    SudokuGrid.prototype.saveData = function() {
      var cell, data, sp;
      data = '';
      sp = 0;
      cell = this.headCell;
      while (cell) {
        if (cell.digit && cell.source === 'user') {
          data += '*'.repeat(Math.floor(sp / 25));
          sp %= 25;
          data += ':'.repeat(Math.floor(sp / 5));
          sp %= 5;
          data += '.'.repeat(sp) + this.symb[cell.digit].pad(this.symbSize, '_', 'left');
          sp = 0;
        } else {
          sp += 1;
        }
        cell = cell.next;
      }
      return data;
    };
    SudokuGrid.prototype.loadData = function(data) {
      var c, cell, i, j, k, _len;
      if (!((data != null) && typeof data === 'string')) {
        return this;
      }
      cell = this.headCell;
      for (i = 0, _len = data.length; i < _len; i++) {
        c = data[i];
        if (!cell) {
          break;
        }
        if (c === '.') {
          cell = cell.next;
        } else if (c === ':') {
          for (j = 0; j < 5; j++) {
            if (cell) {
              cell = cell.next;
            }
          }
        } else if (c === '*') {
          for (j = 0; j < 25; j++) {
            if (cell) {
              cell = cell.next;
            }
          }
        } else {
          k = this.symb.indexOf(data.substr(i, this.symbSize).replace(/_/g, ''));
          if ((1 <= k && k <= this.s)) {
            cell.set(k, 'user', true);
            i += this.symbSize - 1;
          }
          cell = cell.next;
        }
      }
      return this;
    };
    SudokuGrid.prototype.load = function(data) {
      var i, map, t, vars;
      if (typeof data !== 'string') {
        throw new Error("Type of data is '" + (typeof data) + "', expected: 'string'");
      }
      data = data.split(/\,/);
      map = {
        h: 3,
        w: 3,
        grids: [],
        houses: []
      };
      i = 0;
      vars = {
        l: 1
      };
      if (i < data.length && data[i].match(/^\d+x\d+$/)) {
        t = data[i].split(/x/);
        map.h = +t[0];
        map.w = +t[1];
        i += 1;
      }
      while (i < data.length && data[i].match(/^\d+:\d+$/)) {
        t = data[i].split(/:/);
        map.grids.push([+t[0], +t[1]]);
        i += 1;
      }
      if (!map.grids.length) {
        map.grids.push([0, 0]);
      }
      while (i < data.length && data[i].match(/^h=[a-zA-Z0-9]+:[A-Z]+[0-9]+$/)) {
        t = data[i].split(/=/)[1].split(/:/);
        map.houses.push({
          type: t[0],
          start: t[1]
        });
        i += 1;
      }
      while (i < data.length && data[i].match(/^\w+=.+$/)) {
        t = data[i].split(/=/);
        vars[t[0]] = t[1];
        i += 1;
      }
      if (vars.symb != null) {
        map.symb = vars.symb;
      }
      if (i === data.length - 1) {
        map.data = data[i];
      }
      return this.loadMap(map);
    };
    SudokuGrid.prototype.loadMap = function(map) {
      var a, b, c, cell, colHead, colNums, colStart, cols, defs, g, grid, house, i, j, r, rowHead, rowNums, rowStart, rows, stime, vgrids, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _len7, _m, _n, _o, _ref, _ref10, _ref11, _ref12, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      stime = (new Date).getTime();
      if (this.headCell) {
        this.unloadMap(false);
      }
      defs = {
        w: 3,
        h: 3,
        grids: [[0, 0]]
      };
      extend(defs, map);
      this._touched = [];
      this._history = new DLSet;
      this._marks = [];
      this._houseMarks = [];
      this.w = Math.floor(+defs.w);
      this.h = Math.floor(+defs.h);
      if (!((1 <= (_ref = this.w) && _ref <= 100000) && (1 <= (_ref2 = this.h) && _ref2 <= 100000))) {
        this.w = this.h = 3;
      }
      if (this.h === 1) {
        _ref3 = [this.w, 1], this.h = _ref3[0], this.w = _ref3[1];
      }
      this.boxes = this.w !== 1;
      this.s = this.w * this.h;
      this.loadSymb(defs.symb);
      this.mi = this.mj = 0;
      vgrids = (function() {
        var _i, _len, _ref4, _results;
        _ref4 = defs.grids;
        _results = [];
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          grid = _ref4[_i];
          i = Math.floor(+grid[0]);
          j = Math.floor(+grid[1]);
          if (!((0 <= i && i <= 100000) && (0 <= j && j <= 100000)) || this.boxes && (i % this.h || j % this.w)) {
            continue;
          }
          if (i + this.s > this.mi) {
            this.mi = i + this.s;
          }
          if (j + this.s > this.mj) {
            this.mj = j + this.s;
          }
          _results.push([i, j]);
        }
        return _results;
      }).call(this);
      if (vgrids.length === 0) {
        vgrids.push([0, 0]);
        this.mi = this.mj = this.s;
      }
      rows = {};
      cols = {};
      this.errors = this.filled = this.ufilled = this.total = 0;
      this.grids = [];
      this.houses = new HouseList;
      for (_i = 0, _len = vgrids.length; _i < _len; _i++) {
        g = vgrids[_i];
        a = g[0], b = g[1];
        grid = {};
        grid.id = this.grids.push(grid) - 1;
        for (j = b, _ref4 = b + this.s; j < _ref4; j += 1) {
          for (i = a, _ref5 = a + this.s; i < _ref5; i += 1) {
            if (!(((_ref6 = rows[i]) != null ? _ref6[j] : void 0) != null)) {
              if ((_ref7 = rows[i]) == null) {
                rows[i] = {};
              }
              if ((_ref8 = cols[j]) == null) {
                cols[j] = {};
              }
              cols[j][i] = rows[i][j] = new SudokuCell({
                s: this.s,
                i: i,
                j: j,
                grid: this
              });
              rows[i][j].on('set', this._cellSet);
              rows[i][j].on('unset', this._cellUnset);
              rows[i][j].on('chsrc', this._cellChsrc);
              this.total += 1;
            }
          }
        }
        grid.pos = rows[a][b];
      }
      rowNums = [];
      for (r in rows) {
        rowNums.push(+r);
      }
      rowNums.sort(function(a, b) {
        return a - b;
      });
      colNums = [];
      for (c in cols) {
        colNums.push(+c);
      }
      colNums.sort(function(a, b) {
        return a - b;
      });
      cell = this.headCell = {};
      for (_j = 0, _len2 = rowNums.length; _j < _len2; _j++) {
        i = rowNums[_j];
        rowHead = false;
        for (_k = 0, _len3 = colNums.length; _k < _len3; _k++) {
          j = colNums[_k];
          if (rows[i][j] != null) {
            cell.next = rows[i][j];
            if (!rowHead) {
              rowHead = rows[i][j];
            } else {
              cell.right = rows[i][j];
              cell.right.left = cell;
            }
            cell.next.prev = cell;
            cell = cell.next;
          }
        }
        cell.right = rowHead;
        cell.right.left = cell;
      }
      this.tailCell = cell;
      this.headCell = this.headCell.next;
      this.headCell.prev = this.tailCell.next = false;
      for (_l = 0, _len4 = colNums.length; _l < _len4; _l++) {
        i = colNums[_l];
        colHead = false;
        for (_m = 0, _len5 = rowNums.length; _m < _len5; _m++) {
          j = rowNums[_m];
          if (cols[i][j] != null) {
            if (!colHead) {
              colHead = cols[i][j];
            } else {
              cell.bottom = cols[i][j];
              cell.bottom.top = cell;
            }
            cell = cols[i][j];
          }
        }
        cell.bottom = colHead;
        cell.bottom.top = cell;
      }
      _ref9 = this.grids;
      for (_n = 0, _len6 = _ref9.length; _n < _len6; _n++) {
        grid = _ref9[_n];
        colStart = rowStart = grid.pos;
        for (i = 0, _ref10 = this.s; i < _ref10; i += 1) {
          this.addHouse('col', colStart);
          this.addHouse('row', rowStart);
          this.addHouse('box', grid.pos.step((i % this.h) * this.w, Math.floor(i / this.h) * this.h));
          colStart = colStart.right;
          rowStart = rowStart.bottom;
        }
      }
      if ((defs.houses != null) && defs.houses instanceof Array) {
        _ref11 = defs.houses;
        for (_o = 0, _len7 = _ref11.length; _o < _len7; _o++) {
          house = _ref11[_o];
          cell = this.getCellByAddr(house.start);
          if (!cell) {
            continue;
          }
          if ((_ref12 = house.type) === 'diag1' || _ref12 === 'diag2') {
            this.addHouse(house.type, cell);
          }
        }
      }
      if (defs.data != null) {
        this.loadData(defs.data);
      }
      if (window.console != null) {
        console.log("built map in: " + ((new Date()).getTime() - stime));
      }
      this.emit('loadMap');
      return this._changed();
    };
    SudokuGrid.prototype.loadSymb = function(s) {
      var i, n, _ref, _ref2;
      this.symbtxt = false;
      if (typeof s === 'string' && s.length && s.length % this.s === 0) {
        this.symbtxt = s;
        n = s.length / this.s;
        this.symb = [''];
        for (i = 0, _ref = this.s; i < _ref; i += 1) {
          this.symb.push(s.substr(i * n, n));
        }
      } else if (this.s < 16) {
        this.symb = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
      } else {
        this.symb = ['', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        for (i = 0, _ref2 = this.s - 10; i < _ref2; i += 1) {
          this.symb.push(_aa(i));
        }
      }
      this.symbSize = this.symb[this.symb.length - 1].length;
      this.emit('loadSymb');
      this._changed();
      return this;
    };
    SudokuGrid.prototype.addHouse = function(type, start) {
      var cell, house, i, j, scell, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4, _ref5, _ref6;
      if (!this.headCell) {
        throw new Error('No map loaded');
      }
      house = {
        type: type,
        filled: 0,
        length: this.s,
        s: start.id
      };
      house.id = "_" + house.type + "_" + house.s;
      if (this.houses[house.id] != null) {
        return this;
      }
      switch (house.type) {
        case 'col':
          cell = start;
          for (i = 0, _ref = this.s; i < _ref; i += 1) {
            house[i] = cell;
            cell = cell.bottom;
          }
          house.p = true;
          break;
        case 'row':
          cell = start;
          for (i = 0, _ref2 = this.s; i < _ref2; i += 1) {
            house[i] = cell;
            cell = cell.right;
          }
          house.p = true;
          break;
        case 'box':
          if (!this.boxes) {
            return this;
          }
          for (i = 0, _ref3 = this.w; i < _ref3; i += 1) {
            for (j = 0, _ref4 = this.h; j < _ref4; j += 1) {
              house[i * this.h + j] = start.step(i, j);
            }
          }
          house.p = true;
          break;
        case 'diag1':
          cell = start;
          for (i = 0, _ref5 = this.s; i < _ref5; i += 1) {
            house[i] = cell;
            cell = cell.right.bottom;
          }
          break;
        case 'diag2':
          cell = start;
          for (i = 0, _ref6 = this.s; i < _ref6; i += 1) {
            house[i] = cell;
            cell = cell.left.bottom;
          }
          break;
        default:
          throw new Error("Unknown house type: " + type);
      }
      for (_i = 0, _len = house.length; _i < _len; _i++) {
        cell = house[_i];
        cell.houses.add(house);
        if (!((house.p != null) || cell.touched)) {
          this._touched.push(cell);
          cell.touched = true;
        }
        if (cell.digit) {
          for (_j = 0, _len2 = house.length; _j < _len2; _j++) {
            scell = house[_j];
            scell.cand[cell.digit] += 1;
          }
          house.filled += 1;
        }
      }
      this.houses.add(house);
      if (house.p == null) {
        this._history.add({
          action: 'addHouse',
          house: house,
          id: "_addHouse_" + house.id
        });
        this.emit('addHouse', house);
        this._changed();
      }
      return this;
    };
    SudokuGrid.prototype.getHouse = function(type, start) {
      var _ref;
      return (_ref = this.houses["_" + type + "_" + start.id]) != null ? _ref.e : void 0;
    };
    SudokuGrid.prototype.delHouse = function(type, start) {
      var cell, house, scell, _i, _j, _len, _len2;
      if (!this.headCell) {
        throw new Error('No map loaded');
      }
      house = start != null ? this.getHouse(type, start) : type;
      if (!house) {
        throw new Error('No such house');
      }
      if (house.p != null) {
        throw new Error('Can not remove protected houses');
      }
      for (_i = 0, _len = house.length; _i < _len; _i++) {
        cell = house[_i];
        cell.houses.remove(house);
        if (!cell.touched) {
          this._touched.push(cell);
          cell.touched = true;
        }
        if (cell.digit) {
          for (_j = 0, _len2 = house.length; _j < _len2; _j++) {
            scell = house[_j];
            scell.cand[cell.digit] -= 1;
          }
        }
      }
      this.houses.remove(house);
      this.emit('delHouse', house);
      this._history.remove("_addHouse_" + house.id);
      return this._changed();
    };
    SudokuGrid.prototype.getCellByNumber = function(number) {
      var cell, dir, m, _ref;
      _ref = number < 0 ? [this.tailCell, 1, 'prev'] : [this.headCell, -1, 'next'], cell = _ref[0], m = _ref[1], dir = _ref[2];
      while (cell) {
        if (number === 0) {
          return cell;
        }
        number += m;
        cell = cell[dir];
      }
      return false;
    };
    SudokuGrid.prototype.getCellByAddr = function(addr) {
      var cell, col, i, j, r, row, _;
      r = addr.match(/^([A-Z]+)(\d+)$/);
      if (r == null) {
        return false;
      }
      _ = r[0], row = r[1], col = r[2];
      i = _aa2i(row);
      j = +col - 1;
      cell = this.headCell;
      while (cell) {
        if (cell.i === i && cell.j === j) {
          return cell;
        }
        cell = cell.next;
      }
      return false;
    };
    SudokuGrid.prototype.dumpHist = function() {
      var it, rec;
      it = this._history.head;
      while (it) {
        rec = it.e;
        console.log(rec.id, rec);
        it = it.next;
      }
    };
    return SudokuGrid;
  })();
  this.SudokuGrid = SudokuGrid;
}).call(this);

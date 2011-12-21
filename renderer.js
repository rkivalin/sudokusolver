(function() {
  var SudokuRenderer;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
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
    }
    SudokuRenderer.prototype.showCandidates = function(cell) {
      var cg, i, j, startx, starty, stepx, stepy, _ref, _results;
      if (cell.digit) {
        return;
      }
      cg = cell[this.id];
      cg.candgridNode = this.svg.group(cg.node, {
        class_: 'candgrid'
      });
      stepx = Math.floor(this.g.sel_nw / this.g.cell_w);
      startx = cg.x + Math.floor(stepx / 2);
      stepy = Math.floor(this.g.sel_nh / this.g.cell_h);
      starty = cg.y + Math.floor(stepy / 2);
      _results = [];
      for (i = 0, _ref = this.g.sel_nh; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        _results.push((function() {
          var _ref2, _results2;
          _results2 = [];
          for (j = 0, _ref2 = this.g.sel_nw; 0 <= _ref2 ? j < _ref2 : j > _ref2; 0 <= _ref2 ? j++ : j--) {
            _results2.push(this.svg.text(cg.candgridNode, startx + i * stepx, starty + j * stepy, {
              class_: 'cand'
            }));
          }
          return _results2;
        }).call(this));
      }
      return _results;
    };
    SudokuRenderer.prototype._touch = function(cell) {
      var cg, newCand, x, _ref;
      if (cell.digit) {
        return;
      }
      cg = cell[this.id];
      if ((1 <= (_ref = cell.rcand.length) && _ref <= 4)) {
        newCand = ((function() {
          var _i, _len, _ref2, _results;
          _ref2 = cell.rcand;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            x = _ref2[_i];
            _results.push(this.grid.symb[x]);
          }
          return _results;
        }).call(this)).join(' ');
        if (newCand !== cg.cand) {
          if (cg.cand !== false) {
            this.svg.remove($('text', cg.node));
          }
          cg.cand = newCand;
          return this.svg.text(cg.node, cg.x + 1, cg.y + 8, cg.cand, {
            class_: 'cand'
          });
        }
      } else if (cg.cand !== false) {
        this.svg.remove($('text', cg.node));
        return cg.cand = false;
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
        } else if (e.keyCode === 32) {
          this.selectCell(this.acell.next || this.grid.headCell);
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
      if (cg.cand !== false) {
        this.svg.remove($('text', cg.node));
        cg.cand = false;
      }
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
      var cell, cg, tnode, _i, _len, _ref, _ref2, _results;
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
          tnode = $('text', cg.node);
          _results.push(tnode.length ? (this.svg.add(cg.node, tnode), this.svg.remove(tnode)) : void 0);
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
      svg.style("@-webkit-keyframes 'appear' {\n    from {\n        opacity: 0;\n    }\n    to {\n        opacity: 1;\n    }\n}\n\n#cells rect { fill: #fff; stroke: #000; stroke-width: 0.2; }\n#cells.keyboard g.active rect { fill: #ccc; }\n#cells g.error rect { fill: #f45252; }\n#cells g.error.active rect { fill: #f42222; }\n#cells text { fill: #666; cursor: default; text-anchor: middle; }\n#cells text.user { fill: #000; }\n#cells text.solver { fill: #039; -webkit-animation: 'appear' 1s; }\n#cells text.gnc { fill: #080; -webkit-animation: 'appear' 0.2s; }\n#cells text.cand { fill: #222; cursor: default; text-anchor: start; font-family: serif; font-size: 8px; }\n\n#selector { opacity: 0.7; }\n#selector:hover { opacity: 0.9; }\n#selector rect { fill: #fff; stroke: #000; stroke-width: 0.2; stroke-linecap: round; }\n#selector g:hover rect { fill: #f3f3f3; }\n#selector text { fill: #000; font-size: 12px; text-anchor: middle; cursor: default; }\n#selector g.disabled rect { fill: #fff; }\n#selector g.disabled text { fill: #ccc; }\n\n#grid_id { opacity: 0.9; fill: #000; stroke: #fff; stroke-width: 2; text-anchor: middle; cursor: default; }\n#grid_id text.active { fill: #e00; }\n#grid_id text:hover { stroke: #66e; }");
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
}).call(this);

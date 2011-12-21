(function() {
  var HouseList, SudokuCell, SudokuGrid;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
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
      _ref = ['w', 'h', 'boxes', 's', 'mi', 'mj', 'grids', '_history', 'houses', 'errors', 'filled', 'ufilled', 'total', '_touched', '_marks', 'agrid', 'gr'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        i = _ref[_i];
        delete this[i];
      }
      this.headCell = this.tailCell = false;
      return this.emit('unloadMap');
    };
    SudokuGrid.prototype.mark = function(cells, digits, color) {
      var cell, d, mark, _i, _len, _results;
      if (color == null) {
        color = 'green';
      }
      mark = {
        cells: [],
        digits: (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = digits.length; _i < _len; _i++) {
            d = digits[_i];
            _results.push(d);
          }
          return _results;
        })(),
        color: color
      };
      this._marks.push(mark);
      _results = [];
      for (_i = 0, _len = cells.length; _i < _len; _i++) {
        cell = cells[_i];
        mark.cells.push(cell);
        _results.push(cell.marks.push);
      }
      return _results;
    };
    SudokuGrid.prototype.removeMarks = function() {};
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

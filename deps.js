(function() {
  var DLList, DLSet, extend, _aa, _aa2i;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
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
}).call(this);

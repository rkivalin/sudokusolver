
extend = (to, from) -> to[i] = from[i] for i of from if from?; null

Array::fill = (dim, value, level = 0) ->
    if typeof dim is 'number' and value? and dim > 0
        @[i] = value for i in [0...dim] by 1
        return @
    return @ if dim[level] < 0
    if dim.length == 1+level
        @[i] = value for i in [0...dim[level]] by 1 if value?
    else
        @[i] = [].fill dim, value, 1+level for i in [0...dim[level]] by 1
    @

Array::remove = (index) ->
    return @ unless 0 <= +index <= @length
    for i in [1+index...@length] by 1
        @[i - 1] = @[i]
    do @pop
    return @

Array::eliminate = (value) ->
    i = 0
    while i < @length
        if @[i] == value
            @remove i
        else i += 1
    return @

String::repeat = (times) ->
    ret = ''
    ret += @ for i in [0...times] by 1 if times > 0
    ret

String::pad = (len, str, type) ->
    half = ''

    repeater = (s, len) ->
        collect = ''
        collect += s while collect.length < len
        collect = collect.substr 0, len

    type = 'right' if type not in ['left', 'right', 'both']

    togo = len - @length
    if togo > 0 then @
    else if type is 'left' then repeater(str, togo) + @
    else if type is 'right' then @ + repeater(str, togo)
    else if type is 'both'
        half = repeater str, Math.ceil togo / 2
        input = (half + @ + half).substr 0, len

process ?= nextTick: (f) -> setTimeout f, 1

class DLList
    constructor: ->
        @head = @tail = no
        @length = 0
    add: (elem) ->
        @head = wrp = {e: elem, next: @head, prev: no}
        if wrp.next then wrp.next.prev = wrp
        else @tail = wrp
        @length += 1
        return wrp
    find: (elem) ->
        it = @head
        while it
            break if it.e is elem
            it = it.next
        return it
    remove: (wrp) ->
        if wrp == @head then @head = wrp.next
        else wrp.prev.next = wrp.next
        if wrp == @tail then @tail = wrp.prev
        else wrp.next.prev = wrp.prev
        @length -= 1
        wrp.dead = true
        return @
    iter: (f) ->
        it = @head
        while it
            r = f it.e
            break if r is false
            it = it.next
        return @

class DLSet extends DLList
    add: (elem) ->
        throw new Error 'Duplicate element in set' if @[elem.id]?
        wrp = super elem
        @[elem.id] = e: elem, w: wrp
    remove: (elem) ->
        ref = if typeof elem is 'string' then @[elem]
        else if typeof elem is 'object' and elem.id? then @[elem.id]
        else elem
        return false if typeof ref isnt 'object'
        super ref.w
        delete @[ref.e.id]
        return ref

_aa = (n) ->
    p = Math.floor Math.log(26+25*n) / Math.log(26)
    aa = ''
    n -= Math.floor (Math.pow(26, p) - 26) / 25
    while p
        aa = String.fromCharCode('A'.charCodeAt(0) + n % 26) + aa
        n = Math.floor n / 26
        p -= 1
    return aa

_aa2i = (aa) ->
    n = (Math.pow(26, aa.length) - 26) / 25
    p = 1
    for i in [aa.length-1..0] by -1
        n += (aa.charCodeAt(i) - 'A'.charCodeAt(0)) * p
        p *= 10
    return n

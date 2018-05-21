$.widget( "custom.laila", {
    // default options
    options: {
        id: 'lailacontrol',
        width: 800,
        height: 600,
        factor: 10,
        reduce_factor: 20,
        image: '',
        color_container: null,
        grid_source: false,
        grid_target: false,
        scale_image: 'none',
        label_separation: 5,
        line_color: '#000000',
        line_weight: 0.1,
        automatic_color: false,
        symbols: false,
        palette: 'default',
        custom_palette: [],
        custom_palette_sort: 'proximity',
        symbols_list: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ¡¿?!çŒœßøæÞð«»‹›¢£€¥ƒ¤÷¬±µ¶@#$%&()=*^{}:;0123456789ø•',
        
        board: null,
        targetboard: null

    },
    
    //to margen
    _margin: 15,
    
    _colors: [],

    _image_obj: null,

    _canvas_s: null,
    _context_s: null,
    _canvas_t: null,
    _context_t: null,

    // the constructor
    _create: function () {
        // add a class for theming
        this.element.addClass( "custom-laila" );
        
        this.board = $( '<canvas id="' + this.options.id + '_board" width="' + this._getRealWidth() + '" height="' + this._getRealHeight() + '" style="border: 1px solid #000; display: none;"></canvas>')
        .appendTo( this.element );

        this.targetboard = $( '<canvas id="' + this.options.id + '_targetboard" width="' + this._getRealWidth() + '" height="' + this._getRealHeight() + '" style="border: 1px solid #000"></canvas>')
        .appendTo( this.element );

        this._canvas_s = document.getElementById(this.options.id + '_board');
        this._context_s = this._canvas_s.getContext('2d');
        this._canvas_t = document.getElementById(this.options.id + '_targetboard');
        this._context_t = this._canvas_t.getContext('2d');
        
    },
    
    _cloneImage: function () {
        
        var imageData = this._context_s.getImageData(0, 0, this._canvas_s.width, this._canvas_s.height);
        var data = imageData.data;
        var color_list = [];

        var pos, r, g, b, colors = [], original_colors = [], colorkey, real_width = this._getRealWidth();
        
        var y_limit = this.options.height;
        var x_limit = this.options.width;

        if (this.options.scale_image == 'none' || this.options.scale_image == 'x') {
            y_limit = this._image_obj.height < y_limit ? this._image_obj.height : y_limit;
        }
        if (this.options.scale_image == 'none' || this.options.scale_image == 'y') {
            x_limit = this._image_obj.width < x_limit ? this._image_obj.width : x_limit;
        }
        
        if (this.options.palette == 'custom') {
            
            //If not exist colors in the custom palette
            if (this.options.custom_palette.length == 0) {
                return;
            }
            
            if (this.options.custom_palette_sort == 'sorted') {
                this.options.custom_palette.sort(function(a, b) { return (a.r*65536+a.g*256+a.b) - (b.r*65536+b.g*256+b.b); });
            }

            for(var m = 0; m < this.options.custom_palette.length; m++) {
                colors[m] = {"rgb": this.options.custom_palette[m].rgb, 'counter': 0};
                color_list[m] = this.options.custom_palette[m];
            }
        }
        else if (this.options.automatic_color) {
        
            if (this.options.palette == 'gray') {
                var factor_root = Math.floor(256/this.options.reduce_factor);
                for(var m = 0; m < this.options.reduce_factor; m++) {
                    r = g = b = factor_root * m;
                    colors[m] = {"rgb": 'rgb(' + r + ', ' + g + ', ' + b + ')', 'counter': 0};
                    color_list[m] = {"r": r, "g": g, "b": b, 'rgb': 'rgb(' + r + ', ' + g + ', ' + b + ')'};
                }
            }
            else {
                var key_colors = [];
                for (var l = 0; l < data.length; l+=4) {
                    r = data[l];
                    g = data[l + 1];
                    b = data[l + 2];
                    if (!key_colors[r + '_' + g + '_'  + b]) {
                        key_colors[r + '_' + g + '_'  + b] = true;
                        original_colors[original_colors.length] = {"r": r, "g": g, "b": b, 'rgb': 'rgb(' + r + ', ' + g + ', ' + b + ')'};
                    }
                }
                
                original_colors.sort(function(a, b) { return (a.r*65536+a.g*256+a.b) - (b.r*65536+b.g*256+b.b); });
    //            original_colors.sort(function(a, b) { return (a.r+a.g+a.b)/3 < (b.r+b.g+b.b)/3; });
    //            original_colors.sort(function(a, b) { return Math.abs(a.r-b.r)*65536 + Math.abs(a.g-b.g)*256 + Math.abs(a.b-b.b); });

                var factor_root = Math.floor(original_colors.length/this.options.reduce_factor);// + Math.floor(this.options.reduce_factor/2);
                var color_list = [];
                for(var m = 0; m < this.options.reduce_factor; m++) {
                    var t = factor_root * m;//(m*2 + 1);
                    colors[m] = {"rgb": original_colors[t].rgb, 'counter': 0};
                    color_list[m] = original_colors[t];
                }
            }
        }
        
        var final_color, final_color_number, symbol_label, color_counter = 0;
        for(var i = this._margin; i < (y_limit + this._margin); i += this.options.factor) {

            for(var j = this._margin; j < (x_limit + this._margin); j += this.options.factor) {
            
                pos = j * 4 + i * 4 * real_width;
                r = data[pos];
                g = data[pos + 1];
                b = data[pos + 2];
                
                if (this.options.palette == 'custom') {

                    var p = 0;
                    if (this.options.custom_palette_sort == 'proximity') {
                        var min = 255*3, tmp = 0;
                        for(var n = 0; n < color_list.length; n++) {
                            tmp = Math.abs(color_list[n].r - r) + Math.abs(color_list[n].g - g) + Math.abs(color_list[n].b - b);
                            if (tmp < min) {
                                min = tmp;
                                p = n;
                            }
                        }
                    }
                    else {
                        p = Math.round((r+g+b)*(color_list.length - 1)/(255+255+255));
                    }
                    colors[p].counter++;
                    final_color = color_list[p].rgb;
                    final_color_number = p;
                }
                else if (!this.options.automatic_color) {
                    
                    if (this.options.reduce_factor) {
                        r = Math.floor(r / this.options.reduce_factor) * this.options.reduce_factor;
                        g = Math.floor(g / this.options.reduce_factor) * this.options.reduce_factor;
                        b = Math.floor(b / this.options.reduce_factor) * this.options.reduce_factor;
                    }

                    if (this.options.palette == 'gray') {
                        r = g = b;
                        colorkey = r;
                    }
                    else {
                        colorkey = r + '_' + g + '_'  + b;
                    }
                    
                    if (!colors[colorkey]) {
                        colors[colorkey] = {"rgb": 'rgb(' + r + ', ' + g + ', ' + b + ')', 'counter': 0, 'index' : color_counter};
                        color_counter++;
                    }
                    else {
                        colors[colorkey].counter++;
                    }
                    final_color = 'rgb(' + r + ', ' + g + ', ' + b + ')';
                    final_color_number = colors[colorkey].index;
                }
                else {
                    var min = 255*3, tmp, p = 0;
                    for(var n = 0; n < color_list.length; n++) {
                        tmp = Math.abs(color_list[n].r - r) + Math.abs(color_list[n].g - g) + Math.abs(color_list[n].b - b);
                        if (tmp < min) {
                            min = tmp;
                            p = n;
                        }
                    }
                    colors[p].counter++;
                    final_color = color_list[p].rgb;
                    final_color_number = p;
                }
                
                this._context_t.beginPath();
                
                if(this.options.symbols) {
                    this._context_t.fillStyle = '#000000';
                    symbol_label = this.options.symbols_list.substr(final_color_number%this.options.symbols_list.length, 1);
                    this._context_t.fillText(symbol_label, j, i + this.options.factor);
                }
                else {
                    this._context_t.fillStyle = final_color;
                    this._context_t.rect(j, i, this.options.factor, this.options.factor);
                    this._context_t.fill();
                }
                
                this._context_t.closePath();
            }
        }
        
        this._colors = colors;
    },
    
    // Return data about colors used in new image
    getDataSummary: function () {
        var count = 0; //Because in some cases, the colors keys are names

        var y_limit = this.options.height;
        var x_limit = this.options.width;

        if (this.options.scale_image == 'none' || this.options.scale_image == 'x') {
            y_limit = this._image_obj.height < y_limit ? this._image_obj.height : y_limit;
        }
        if (this.options.scale_image == 'none' || this.options.scale_image == 'y') {
            x_limit = this._image_obj.width < x_limit ? this._image_obj.width : x_limit;
        }

        for (var k in this._colors) {
            this._colors[k].percent = Math.round(this._colors[k].counter * 100 * this.options.factor * this.options.factor / (y_limit * x_limit));
            this._colors[k].symbol = this.options.symbols_list.substr(count % this.options.symbols_list.length, 1);
            count++;
        }
        
        return this._colors;
    },

    /**
     * Draw matrix in a specific board
     */
    _drawMatrix: function (target) {

        var canvas = document.getElementById(target);
        var context = canvas.getContext('2d');

        context.fillStyle = '#000000';
        context.beginPath();
        for (var i = 0; i <= this.options.width/this.options.factor; i++) {
            context.moveTo(i*this.options.factor + this._margin, this._margin);
            context.lineTo(i*this.options.factor + this._margin, this.options.height + this._margin);
            
            if (i > 0 && (i%this.options.label_separation == 0 || i == 1)) {
                context.fillText(i, (i - 1) * this.options.factor + this._margin, this._margin);
                context.fillText(i, (i - 1) * this.options.factor + this._margin, 2 * this._margin + this.options.height);
            }
        }
        
        for (var j = 0; j <= this.options.height/this.options.factor; j++) {
            context.moveTo(this._margin, j*this.options.factor + this._margin);
            context.lineTo(this.options.width + this._margin, j*this.options.factor + this._margin);

            if (j > 0 && (j%this.options.label_separation == 0 || j == 1)) {
                context.fillText(j, 0, j * this.options.factor + this._margin);
                context.fillText(j, this.options.width + this._margin, j * this.options.factor + this._margin);
            }
        }

        context.closePath();
        context.lineWidth = this.options.line_weight;
        context.strokeStyle = this.options.line_color;
        context.stroke();
    },
    
    /**
     * Draw matrix in source board
     */
    matrixToSource: function () {
        this._drawMatrix (this.options.id + '_board');
    },

    /**
     * Draw matrix in target board
     */
    matrixToTarget: function () {
        this._drawMatrix (this.options.id + '_targetboard');
    },
    
    /**
     * Set the board to initial state 
     *
     */
    _clearBoard: function () {

        // Store the current transformation matrix
        this._context_s.save();
        this._context_t.save();

        // Use the identity matrix while clearing the canvas
        this._context_s.setTransform(1, 0, 0, 1, 0, 0);
        this._context_s.clearRect(0, 0, this._canvas_s.width, this._canvas_s.height);
        this._context_t.setTransform(1, 0, 0, 1, 0, 0);
        this._context_t.clearRect(0, 0, this._canvas_t.width, this._canvas_t.height);

        // Restore the transform
        this._context_s.restore();
        this._context_t.restore();
    },
    
    repaint: function(f) {
      this._clearBoard();
      this.paint(f);
    },
    
    paint: function(f) {
    
        var real_width = this._getRealWidth();
        var real_height = this._getRealHeight();

        //If change the default size
        if (this.board.attr('width') != real_width) {
            this.board.attr('width', real_width);
            this.board.css('width', real_width);
            this.targetboard.attr('width', real_width);
            this.targetboard.css('width', real_width);
        }

        if (this.board.attr('height') != real_height) {
            this.board.attr('height', real_height);
            this.board.css('height', real_height);
            this.targetboard.attr('height', real_height);
            this.targetboard.css('height', real_height);
        }

        //Drag background rect with white color
        this._context_t.beginPath();
        this._context_t.rect(0, 0, real_width, real_height);
        this._context_t.fillStyle = '#ffffff';
        this._context_t.fill();
        this._context_t.closePath();

        this._context_s.beginPath();
        this._context_s.rect(0, 0, real_width, real_height);
        this._context_s.fillStyle = '#ffffff';
        this._context_s.fill();
        this._context_s.closePath();
        
        //Drag the picture
        if (this.options.image != '') {
            this._image_obj = new Image();
            this._image_obj.src = this.options.image;
            
            var parent_obj = this;
            this._image_obj.onload = function() {
                var canvas = document.getElementById(parent_obj.options.id + '_board');
                var context = canvas.getContext('2d');
                
                var img_w = new_w = this.width < parent_obj.options.width ? this.width : parent_obj.options.width;
                var img_h = new_h = this.height < parent_obj.options.height ? this.height : parent_obj.options.height;

                if (parent_obj.options.scale_image == 'xy' || parent_obj.options.scale_image == 'x') {
                    new_w = parent_obj.options.width;
                    img_w = this.width;
                }
                if (parent_obj.options.scale_image == 'xy' || parent_obj.options.scale_image == 'y') {
                    new_h = parent_obj.options.height;
                    img_h = this.height;
                }
                
                context.drawImage(this, 0, 0, img_w, img_h, parent_obj._margin, parent_obj._margin, new_w, new_h);
                
                parent_obj._cloneImage();
                parent_obj._applyProperties();
                f();
            };
        }
    },
    
    _applyProperties: function() {
        if(this.options.grid_source) {
            this.matrixToSource();
        }

        if(this.options.grid_target) {
            this.matrixToTarget();
        }
    },
    
    _getRealWidth: function() {
        return this.options.width + 2 * this._margin;
    },
    
    _getRealHeight: function() {
        return this.options.height + 2 * this._margin;
    },
    
    executeSampleColor: function(f) {

        if (f) {
            parent_obj = this;
            this._executeSampleColorHandler = (function(evt) {
                var position = parent_obj._canvas_s.getBoundingClientRect();
                var imageData = parent_obj._context_s.getImageData(0, 0, parent_obj._canvas_s.width, parent_obj._canvas_s.height);
                var data = imageData.data;

                var pos = (Math.round(evt.clientX - position.left) + Math.round(evt.clientY - position.top) * parent_obj._canvas_s.width) * 4;
                f({"r": data[pos], "g": data[pos + 1], "b": data[pos + 2], "a": data[pos + 3], 'rgb': 'rgb(' + data[pos] + ', ' + data[pos + 1] + ', ' + data[pos + 2] + ')'});
            });

            this._canvas_s.addEventListener('click', this._executeSampleColorHandler, false);
        }
        else {
            this._canvas_s.removeEventListener('click', this._executeSampleColorHandler, false);
        }
    },
    
    _executeSampleColorHandler: function(evt) {
        //Helper. Used to save the reference to the function for remove if is required
    },

    getTargetCanvas: function() {
        return this._canvas_t;
    }
    
});


function _ll (key) {
    return laila_strings[laila_strings_lang][key] ? laila_strings[laila_strings_lang][key] : key;
}


var laila_strings = [];
laila_strings_lang = 'es';


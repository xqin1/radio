/*
 * Accessifyhtml5.js
 *
 * Source: https://github.com/yatil/accessifyhtml5.js
 */
 
var AccessifyHTML5=function(b){if(document.querySelectorAll){var g={article:{role:"article"},aside:{role:"complementary"},nav:{role:"navigation"},output:{"aria-live":"polite"},section:{role:"region"},"[required]":{"aria-required":"true"}};if(b){if(b.header){g[b.header]={role:"banner"}}if(b.footer){g[b.footer]={role:"contentinfo"}}if(b.main){g[b.main]={role:"main"}}}for(var e in g){var a=document.querySelectorAll(e),d=g[e],f,h,j,c=0;for(j in d){f=j;h=d[j]}for(c;c<a.length;c++){if(!a[c].hasAttribute(f)){a[c].setAttribute(f,h)}}}}};


(function ($) {
   // Enable Skiplinks to work in WebKit browsers (e.g. Safari and Chrome) 
	var is_webkit = navigator.userAgent.toLowerCase().indexOf('webkit') > -1;
	var is_opera = navigator.userAgent.toLowerCase().indexOf('opera') > -1;
	
	if (is_webkit || is_opera) {
		$('.skipLink').click(function(e) {
			var target = $(this).attr('href');
			$(target)[0].focus();
		});	
	}
   
   AccessifyHTML5({
        header:"body>header", 
        footer:"body>footer",
        main: "#site-content"
    });
	
	if($('.msg-error').length > 0) {
			$('.msg-error:first').find('input[required]').focus();
		}
		
})(window.jQuery);
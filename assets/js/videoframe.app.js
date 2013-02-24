var videoFrame = {
	isWebKit : (/AppleWebKit/gi.test(navigator.userAgent)),
	jsonArr : [],
	dataScreenShots : [],
	isInitialized : false,
	init: function() {
		if (this.isWebKit) {
			$('html').removeClass('not-webkit');
			_gaq.push(['_trackEvent', 'AppStart', 'isWebKit']);
		} else {
			$('#browser-not-supported').modal();
			$('a[href="#documentation"]').tab('show');
			_gaq.push(['_trackEvent', 'AppStart', 'isNotWebKit']);
			// $('#mainWrapper .well').eq(0).hide().prev().hide();
		}

		// Initiate the video player
		_V_('videoPlayer', { 'controls': false, 'autoplay': false, 'loop': false }, function() {
			this.src({ type: 'video/mp4', src: 'assets/timecodedAssets/MP4/24fps.mp4' });
			this.load();
			this.volume(0);

			this.addEvent('play', function(){
				video.listen($('#currentMethod').attr('data-video-frame-method'));
				$('#playButton').html('<i class="icon-pause"></i>');
				_gaq.push(['_trackEvent', 'VideoPlayer', 'Start Playback']);
			});

			this.addEvent('pause', function(){
				video.stopListen();
				$('#playButton').html('<i class="icon-play"></i>');
				_gaq.push(['_trackEvent', 'VideoPlayer', 'Pause Playback']);
			});

			this.addEvent('ended', function() {
				this.cancelFullScreen();
				video.stopListen();
				$('#playButton').html('<i class="icon-play"></i>');
				_gaq.push(['_trackEvent', 'VideoPlayer', 'Video Ended']);
			});

			this.addEvent('fullscreenchange', function(evt) {
				if (this.isFullScreen) {
					video.stopListen();
				}
			});
			_gaq.push(['_trackEvent', 'VideoPlayer', 'init Success']);
		});


		// Set the source and display format
		$('.frameRate').bind('click', function(evt) {
			evt.preventDefault();
			video.video.pause();
			video.stopListen();
			videoFrame.resetFrameCount();
			$('#playButton').html('<i class="icon-play"></i>');

			var elem = $(evt.target);
			var parentId = elem.closest('ul').attr('id');
			if (parentId === 'frameRateMenu') {
				$('#currentFrameRate').html(elem.attr('data-frame-rate'));
				var rate = elem.attr('data-frame-rate').toLowerCase().replace(' ', '').replace('.','');
				video.frameRate = Number(elem.html());
				$('#trackFrameRate').html(Number(elem.html()));
				_V_('videoPlayer').src({ type: 'video/mp4', src: 'assets/timecodedAssets/MP4/' + rate + '.mp4' });
			} else if (parentId === 'videoFrameMethods') {
				video.video.currentTime = 0;
				$('#currentMethod').html(elem.html()).attr('data-video-frame-method', elem.attr('data-video-frame-method'));
			}
			_gaq.push(['_trackEvent', 'VideoPlayer', 'Source Change', elem.attr('data-video-frame-method')]);
		});

		$('.updateConversionMethod').bind('click', function(evt) {
			evt.preventDefault();
			var elem = $(evt.target);
			$('#currentConversionMethod').html(elem.html()).attr('data-conversion-method', elem.attr('data-conversion-method'));
			_gaq.push(['_trackEvent', 'Conversion', 'Conversion Method Update', elem.attr('data-conversion-method')]);
		});

		$('.updateConversionFrameRate').bind('click', function(evt) {
			evt.preventDefault();
			var elem = $(evt.target);
			$('#currentConversionFrameRate').html(elem.html()).attr('data-conversion-frame-rate', elem.attr('data-conversion-frame-rate'));
			_gaq.push(['_trackEvent', 'Conversion', 'Frame Rate Update', elem.attr('data-conversion-frame-rate')]);
		});

		$('#seekBackward').bind('click', function(evt) {
			evt.preventDefault();
			video.seekBackward($('#seekBackwardOver button.active').html(), videoFrame.triggerFrameUpdate);
			_gaq.push(['_trackEvent', 'VideoControls', 'Seek', 'Backward']);
		});

		$('#seekForward').bind('click', function(evt) {
			evt.preventDefault();
			video.seekForward($('#seekForwardOver button.active').html(), videoFrame.triggerFrameUpdate);
			_gaq.push(['_trackEvent', 'VideoControls', 'Seek', 'Forward']);
		});

		$('#playButton').bind('click', videoFrame.toggleVideo);
		$('#captureScreenShot').bind('click', videoFrame.getScreenShot);
		$('#captureFrame').bind('click', videoFrame.addFrame);
		$('#convertSMPTEValue').bind('click', videoFrame.convertSMPTE);
		$('#convertFrameValue').bind('click', videoFrame.convertFrame);

		// Bind the keyboard shortcut functionality
		$(document).bind('keydown', function(evt) {
			var code = evt.which || evt.keyCode;
			// 37:left - 39:right - 70:F - 32:space - 83:S
			if (evt.shiftKey && ((code === 37) || (code === 39) || (code === 70) || (code === 83))) {
				evt.preventDefault();
				switch (code) {
					case 37: $('#seekBackward').trigger('click'); break;
					case 39: $('#seekForward').trigger('click'); break;
					case 70: $('#captureFrame').trigger('click'); break;
					case 83: $('#captureScreenShot').trigger('click'); break;
				}
			}
			if (code === 32) {
				evt.preventDefault();
				$('#playButton').trigger('click');
			}
		});

		// Carousel
		$('.carousel').carousel({
			interval: 5000,
			pause: 'hover'
		});
		// Tooltips
		$('.triggerTooltip').tooltip();
		// Popovers
		$('.triggerPopover').popover({trigger:'hover'});
		// Pretty Print
		prettyPrint();

		// Icon zoom in animation
		$('.videoFrameIcon').mouseover(function() {
			$(this).css({ fontSize:'210px' });
		}).mouseout(function() {
			$(this).css({ fontSize:'185px' });
		});

		// Tab application routing
		$('a[data-toggle="tab"]').bind('click', function() {
			var id = $(this).attr('href').replace('#','');
			// Set the location hash for routing
			location.hash = '!/' + id;
			_gaq.push(['_trackEvent', 'Navigation', 'Tabs', id]);
		});

		// Documentation side navigation functionality
		$('#documentation ul.nav li a').bind('click', function(evt) {
			evt.preventDefault();
			var elem = $(this);
			$('#documentation .nav li.active').removeClass('active').after(function() {
				elem.closest('li').addClass('active');
				var id = elem.attr('href');

				// Set the location hash for routing
				var hash = elem.data().hash;
				location.hash = '!' + hash;
				$('html, body').animate({ scrollTop: $(id).offset().top }, 250);
				_gaq.push(['_trackEvent', 'Navigation', 'Documentation', id]);
			});
			return false;
		});

		// BEGIN Documentation scrolling side navigation
		var timeOut;
		$(window).bind('scroll', function(evt) {
			clearTimeout(timeOut);
			timeOut = setTimeout(handleScroll, 15);
		});

		function handleScroll() {
			if (!/documentation/.test(location.hash)) {
				$('#documentation ul.nav').css({ 'position' : 'static' });
				return;
			}
			var scrollTop = $(document).scrollTop();
			var scrollStop = $('#methodStopListen').offset().top;
			var startFixed = $('#documentation .pull-left').offset().top;
			var negative;
			if (scrollTop >= scrollStop) {
				negative = scrollTop - scrollStop;
			}

			if (scrollTop >= startFixed) { // 438
				$('#documentation ul.nav').css({
					'position' : 'fixed',
					'top' : (negative ? '-' + negative : '0') + 'px'
				});
			} else {
				$('#documentation ul.nav').css({ 'position' : 'static' });
			}
		}
		// END Documentation scrolling side navigation

		$('#videoControls').bind('hover', function() {
			if (!$('#seekForwardOver').is(':visible')) {
				$('#seekForwardOver, #seekBackwardOver').dequeue().fadeIn('slow');
			}
		});

		return this.routeApp();
	},
	routeApp : function() {
		if (!this.isInitialized) { return; }
		// Check for a hash and direct to the appropriate section of the page
		var context = location.hash;
		if (/documentation/.test(context)) {
			$('a[href="#documentation"]').tab('show').after(function() {
				switch(context) {
					case '#!/documentation/configuration': $('a[href="#configuration"]').trigger('click'); break;
					case '#!/documentation/get': $('a[href="#methodGet"]').trigger('click'); break;
					case '#!/documentation/toSMPTE': $('a[href="#methodToSMPTE"]').trigger('click'); break;
					case '#!/documentation/seekForward': $('a[href="#methodSeekForward"]').trigger('click'); break;
					case '#!/documentation/seekBackward': $('a[href="#methodSeekBackward"]').trigger('click'); break;
					case '#!/documentation/toTime': $('a[href="#methodToTime"]').trigger('click'); break;
					case '#!/documentation/toSeconds': $('a[href="#methodToSeconds"]').trigger('click'); break;
					case '#!/documentation/toMilliseconds': $('a[href="#methodToMilliseconds"]').trigger('click'); break;
					case '#!/documentation/toFrames': $('a[href="#methodToFrames"]').trigger('click'); break;
					case '#!/documentation/listen': $('a[href="#methodListen"]').trigger('click'); break;
					case '#!/documentation/stopListen': $('a[href="#methodStopListen"]').trigger('click'); break;
					case '#!/documentation/FrameRates': $('a[href="#propertyFrameRates "]').trigger('click'); break;
				}
			});
		}
		this.isInitialized = true;
		_gaq.push(['_trackEvent', 'RouteApp', 'Hash', context]);
	},
	resetFrameCount : function() {
		$('#trackSMPTE').html('00:00:00:00').removeClass('btn-success').addClass('btn-danger disabled');
		$('#trackFrames').html('0').removeClass('btn-success').addClass('btn-danger disabled');
		$('#trackTime').html('00:00:00').removeClass('btn-success').addClass('btn-danger disabled');
	},
	toggleVideo : function() {
		var video = _V_('videoPlayer');
		if (video.paused()) {
			video.play();
		} else {
			video.pause();
		}
		_gaq.push(['_trackEvent', 'VideoControls', 'Playback', 'Player State:' + (video.paused() ? 'Paused' : 'Playing')]);
	},
	triggerFrameUpdate : function() {
		switch ($('#currentMethod').attr('data-video-frame-method')) {
			case "SMPTE":
				$('#trackSMPTE').html(video.toSMPTE()).removeClass('disabled btn-danger').addClass('btn-success');
				$('#SMPTE-timeCode').attr('placeholder', video.toSMPTE());
				break;
			case "time":
				$('#trackTime').html(video.toTime()).removeClass('disabled btn-danger').addClass('btn-success');
				break;
			case "frame":
				$('#trackFrames').html(Math.floor(video.get())).removeClass('disabled btn-danger').addClass('btn-success');
				break;
		}
	},
	convertSMPTE : function() {
		var timeCode = $('#SMPTE-timeCode').val() || $('#SMPTE-timeCode').attr('placeholder');
		var conversionMethod = $('#currentConversionMethod').attr('data-conversion-method');
		switch (conversionMethod) {
			case "seconds":
				$('#convertedValue').html('<div>' + video.toSeconds(timeCode) + '</div>');
				break;
			case "milliseconds":
				$('#convertedValue').html('<div>' + video.toMilliseconds(timeCode) + '</div>');
				break;
			case "frames":
				$('#convertedValue').html('<div>' + video.toFrames(timeCode) + '</div>');
				break;
		}
		_gaq.push(['_trackEvent', 'Conversion', 'SMPTE to ' + conversionMethod]);
	},
	convertFrame : function() {
		var frame = $('#frame-number').val() || $('#frame-number').attr('placeholder');
		$('#convertedFrameValue').html('<div>' + video.toSMPTE(frame) + '</div>');
		_gaq.push(['_trackEvent', 'Conversion', 'Frame to SMPTE']);
	},
	// BEGIN Proprietary to Crackle Maybe??
	addFrame : function() {
		var SMPTE = video.toSMPTE();
		// var imgData = getScreenShot('dataURI');
		// var jsonObj = '{ "frame": "' + SMPTE + '", "img": "' + imgData + '" }';
		var jsonObj = '{ "frame": "' + SMPTE + '" }';

		videoFrame.jsonArr.push(jsonObj);
		var clonedRow = $('#videoFrameTable tbody tr:last').clone().show();
		// var clonedRow = $('#videoFrameTable li:last').clone().show();

		clonedRow.find('td').each(function(i) {
		// clonedRow.find('div').each(function(i) {
			var elem = $(this);

			if (elem.hasClass('frameID')) {
				elem.html(1 + Number(elem.html()));
			} else if (elem.hasClass('frameSMPTE')) {
				elem.html(SMPTE);
			}
			// else if (elem.hasClass('frameThumbnail')) {
			//	elem.html('<img class="img-rounded img-polaroid" src="' + imgData + '" />');
			// }
		});
		$('#videoFrameTable tbody').append(clonedRow);
		// $('#videoFrameTable').append(clonedRow);
		$('#videoFrameResults').fadeIn('500');
		_gaq.push(['_trackEvent', 'VideoControls', 'SMPTE Time Code Captured']);
	},
	buildJSON : function() {
		var jsonStr = '[' + videoFrame.jsonArr.join(',') + ']';
		return JSON.parse(jsonStr);
	},
	getScreenShot: function(bypass) {
		var SMPTE = video.toSMPTE();
		var canvas = document.createElement('canvas');
		canvas.width  = video.video.videoWidth;
		canvas.height = video.video.videoHeight;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(video.video, 0, 0);
		var dataURI = canvas.toDataURL('image/jpeg');
		if (bypass === 'dataURI') { return dataURI; }
		var thumbnail = '<li style="display:none;"><a href="javascript:void(0);" class="thumbnail"><img src="' + dataURI + '" alt="' + SMPTE + '" /><p>' + SMPTE + '</p></a></li>';
		$('#videoFrameScreenshots ul').append(thumbnail).after(function() {
			$('#videoFrameScreenshots li').fadeIn('500');
		});
		$('#videoFrameScreenshots').fadeIn('500');
		_gaq.push(['_trackEvent', 'VideoControls', 'Thumbnail Generated']);
	},
	buildThumbnails : function() {
		var screenShots = '[' + videoFrame.dataScreenShots.join(',') + ']';
		var screenShotsObj = JSON.parse(screenShots);
		screenShotsObj.forEach(function(i) {
			var image = document.createElement('img');
			image.className = 'img-rounded img-polaroid';
			image.src = i.img;
			image.alt = i.frame;
			document.getElementById('videoFrameScreenshots').appendChild(image);
		});
	}
	// END Proprietary to Crackle Maybe?
};
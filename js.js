$().ready(function(){
	npdc = {
		alert: function(text){
			$('#overlay .inner').addClass('box').text(text);
			$('#overlay .inner').append('<br/><br/><button onclick="npdc.close();">OK</button>');
			$('#overlay').fadeIn(100, function(){
				$(window).on('keyup', function(event){
					var code = event.keyCode || event.which;
					if(code === 13 || code === 27){
						npdc.close();
					}
				})
			});
		},
		confirm: function(text, trueCallback, falseCallback, trueText, falseText){
			trueText = (typeof trueText === 'undefined') ? 'OK' : trueText;
			falseText = (typeof falseText === 'undefined') ? 'Cancel' : falseText;
			$('#overlay .inner').addClass('box').text(text);
			$('#overlay .inner').append('<br/><br/><button id="trueButton">'+trueText+'</button> <button id="falseButton">'+falseText+'</button>');
			$('#overlay .inner.box button').on('click', function(){
				npdc.close();
			});
			$('#trueButton').on('click', trueCallback);
			if(falseCallback !== null){
				$('#falseButton').on('click', falseCallback);
			}
			$('#overlay').fadeIn(100, function(){
				$(window).on('keyup', function(event){
					var code = event.keyCode || event.which;
					if(code === 13){
						npdc.close();
						trueCallback();
					}
					if(code === 27){
						npdc.close();
						if(falseCallback !== null){
							falseCallback();
						}
					}
				})
			});
		},
		close: function(val){
			$(window).off('keyup');
			$('#overlay').fadeOut(100, function(){
				$('#overlay .inner').removeClass('box').text('');
			});
		}
	};
	
	lookup = {
		add: function(tbl){
			tbl.data('newCount', tbl.data('newCount')+1);
			suffix = '_'+tbl.data('newCount');
			tbl.find('[id$=_new]').each(function(){
				$(this).attr('id', $(this).attr('id')+suffix);
			});
			tbl.find('[name$=_new\\[\\]]').each(function(){
				$(this).attr('name', $(this).attr('name').slice(0,-2)+suffix+'[]');
			});
			tbl.find('[name$=_new]').each(function(){
				$(this).attr('name', $(this).attr('name')+suffix);
			});
			tbl.find('[for$=_new]').each(function(){
				$(this).attr('for', $(this).attr('for')+suffix);
			});
			tbl.find('#'+tbl.data('newRowBaseId')+suffix+' td:nth-child(2)').click(function(){
				lookup.delete($(this).parent().attr('id'));
			});
			clone = tbl.data('clone');
			tbl.data('clone', clone.clone());
			
			clone.insertAfter($('#'+tbl.data('newRowBaseId')+suffix));
			$('#'+tbl.data('newRowBaseId')+' select:not(.no-select2):not(.select2-hidden-accessible)').each(function(){
				makeSelect2(this);
			});
			if(tbl.hasClass('lookuptable')){
				initialize.lookuptable(clone);
			}
		},
		delete: function(id){
			var tbl = $('#'+id).parents('table');
			var input = $('#'+id).find('td:nth-of-type('+tbl.attr('data-n-label')+')').find('input');
			var form = input.parents('form');
			npdc.confirm('Do you want to delete '+input.val()+' here?',
				function(){
					$('#'+id).remove();
				},
				null,
				'Yes, delete',
				'No, keep'
			);
		},
		updateField: function(event){
			tbl = $(event).parents('table');
			if(l-1 === lookup.cur && $(event).parents('table').attr('data-new-url') !== undefined){
				name = $(event).text().substring(4);
				$('#overlay .inner').html('<iframe src="'+$(event).parents('table').attr('data-new-url')+'/'+name+'"></iframe>');
				$('#overlay').show();
				$("form :input").prop('disabled', true);
				$('#overlay').data('element', tbl);
				$('#overlay').data('type', 'lookupfield');
			} else {
				this.saveOption(tbl, $(event).attr('value'), $(event).text(), $(event).attr('data-nextfield'));
			}
		},
		saveOption: function(tbl, id, value, nextfield){
			if(tbl.hasClass('single')){
				$(tbl).data('lookupfield').val(value).attr('readonly', 'readonly').addClass('readonly')
					.siblings('input[type=hidden]').val(id);
				tbl.data('lookupfield').off('keyup keydown focus');
			} else {
				$('[name='+tbl.attr('data-source-field')+'_new]')
						.val(value)
						.attr('readonly', 'readonly')
						.addClass('readonly');
				$('[name='+tbl.attr('data-target-field')+'_new]').val(id);
				tbl.data('lookupfield').off('keyup keydown focus');
				if($('[name='+tbl.attr('data-source-field')+'_new]').attr('data-onsubmit') !== undefined && nextfield !== undefined){
					var field = $('[name='+tbl.attr('data-source-field')+'_new]').attr('data-onsubmit');
					if($('[name='+field+'_new]').attr('data-ajax-url') !== undefined){
						$('[name='+field+'_new]').addClass('ajax-target');
						$.get($('[name='+field+'_new]').attr('data-ajax-url')+'/'+nextfield, function(responseText){
							$('.ajax-target')
									.append($('<option>', { value : responseText[0][0] })
									.text(responseText[0][1].replace('&amp;', '&')));
							$('.ajax-target').val(nextfield).trigger('change');
							$('.ajax-target').removeClass('ajax-target');
						});
					}
					$('[name='+field+'_new]').val(nextfield).trigger('change');
				}
				lookup.add(tbl);
			}
			$('#optionwrapper').remove();
			form = $(tbl).parents('form');
		},
		selectOption: function(element, skipStep){
			skipStep = typeof skipStep !== 'undefined' ? skipStep : false;
			clearTimeout(lookup.timer);
			fullString = $(element).attr('data-self');
			if($(element).hasClass('notSelected')){
				$('#optionwrapper div').removeClass('clicked').addClass('notSelected hidden');
				$('#optionwrapper :not([data-parent])').removeClass('hidden');
				$(element).removeClass('notSelected hidden');
				testElement = element;
				while($(testElement).is('[data-parent]')){
					$('[data-parent="'+$(testElement).attr('data-parent')+'"]').removeClass('hidden');
					testElement = '[data-self="'+$(testElement).attr('data-parent')+'"]';
					$(testElement).removeClass('notSelected').addClass('clicked');
				}
			} 
			
			if($(element).hasClass('clicked') || $('div[data-parent="'+fullString+'"]').length === 0 || skipStep){
				if($(element).attr('data-parent') === undefined){
					$(element).text($(element).text());
				} else {
					truncated = [];
					$(element).attr('data-parent').split('>').forEach(function(item){
						if(item.trim().length > 12){
							truncated.push(item.trim().substring(0,10)+'...');
						} else {
							truncated.push(item.trim());
						}
					});
					var text = $(element).text().trim();
					lof = text.lastIndexOf('>');
					if(lof > -1){
						text = text.substring(lof).trim();
					}
					$(element).text(truncated.join(' > ')+' '+text);
				}
				lookup.updateField(element);
			} else {
				$(element).addClass('clicked');
				$(element).siblings(':not(.clicked)').addClass('notSelected');
				$('[data-parent="'+fullString+'"]').removeClass('hidden notSelected');
				lookup.scrollOptionwrapper(true);
			}
		},
		positionOptionwrapper: function(){
			if($('#optionwrapper').length > 0){
				if($('#optionwrapper').prev('input').offset().top-$('body').scrollTop() > ($(window).height() / 2)){
					$('#optionwrapper').css('max-height', $('#optionwrapper').prev('input').offset().top-$('body').scrollTop()).css('bottom', $('#optionwrapper').parent().height());
					$('#optionwrapper').addClass('above');
				} else {
					$('#optionwrapper').css('max-height', $(window).height()-30-($('#optionwrapper').prev('input').offset().top-$('body').scrollTop())).css('bottom', 'auto');
					$('#optionwrapper').removeClass('above');
				}
			}
		},
		scrollOptionwrapper: function(top){
			if(lookup.cur === -1){
				return;
			}
			if(top){
				$('#option_'+lookup.cur).parent().scrollTop(
						$('#option_'+lookup.cur).parent().scrollTop()
							+ $('#option_'+lookup.cur).position().top
							- 15
					);
			} else if($('#option_'+lookup.cur).position().top < 0){
				$('#option_'+lookup.cur).parent().scrollTop(
						$('#option_'+lookup.cur).parent().scrollTop()
							+ $('#option_'+lookup.cur).position().top
							- 15
					);
			} else if ($('#option_'+lookup.cur).position().top > $('#option_'+lookup.cur).parent().height()-30){
				$('#option_'+lookup.cur).parent().scrollTop(
						$('#option_'+lookup.cur).parent().scrollTop()
							+ $('#option_'+lookup.cur).position().top
							- $('#option_'+lookup.cur).parent().height()
							+ 40
					);
			}
		}
	};

		initialize = {
		lookuptable: function(row, single){
			if(single){
				var lookupfield = $(row).find('input[type=text]');
			} else {
				var lookupfield = $('input[name='+row.parents('table').attr('data-source-field')+'_new]');
			}
			lookupfield.parents('table').find('.lookupwrapper').removeClass('lookupwrapper');
			lookupfield.parent().addClass('lookupwrapper');
			lookupfield.cur = null;
			lookupfield.parents('table').data('lookupfield', lookupfield);
			lookupfield.on('keydown keyup focus paste', function(event){
				var code = event.keyCode || event.which;
				if((code !== 13 && code !== 9 && event.type === 'keydown') || ((code === 13 || code === 9) && event.type === 'keyup')){
					return;
				}
				var value = lookupfield.val();
				if(value !== lookupfield.cur){
					$('#optionwrapper').remove();
					if(value.length >= 2 || true){
						var url = 'data.php?q='+value;
						$('[name^='+lookupfield.parents('table').attr('data-target-field')+']').each(function(){
							if($(this).val() !== ''){
								url += '&e[]='+$(this).val();
							}
						});
						$.ajax(url, 'json').done(function(data){
							if(value === lookupfield.val()){
								$('#optionwrapper').remove();
								optionlist = [];
								options = '<div id="optionwrapper" class="options"></div>';
								lookupfield.after(options);
								lookup.positionOptionwrapper();
								l = data.length;
								lookup.data = data;
								lookup.cur = -1;
								if(l > 0){
									$.each(data, function(i, value) {
										displayValue = value[1];
										parent = value[1].substring(0,value[1].lastIndexOf('>')).trim();
										if(lookupfield.cur.length > 0){
											displayValue = value[1].replace(new RegExp('('+ lookupfield.cur + ')', 'gi'), '<mark>$1</mark>');
										} else if(parent.length === 0){
											parent=undefined;
										} else {
											displayValue = (value[1].match(/>/g).join('').replace(/>/g, '\xa0\xa0\xa0') || [])+value[1].substring(value[1].lastIndexOf('>')).trim();
										}
										var optionDisplay = $('<div>')
											.html(displayValue)
											.attr('id', 'option_'+i)
											.attr('value', value[0])
											.attr('data-parent', parent)
											.attr('data-self', value[1]);
										if(value.length > 2){
											optionDisplay.attr('data-nextfield', value[2]);
										}
										$('#optionwrapper').append(optionDisplay);	
									});
								} else {
									$('#optionwrapper').append($('<div>').html('<i>No results found</i>'));
								}
								if($('#optionwrapper').parents('table').attr('data-new-url') !== undefined){
									$('#optionwrapper').append($('<div>')
											.html('<i>Add '+$('#optionwrapper').siblings('input').val()+'</i>')
											.attr('id', 'option_'+l)
											.attr('value', 'new'));							
									l += 1;
								}
								$('#optionwrapper div[value]').on('mouseenter', function(){
									lookup.cur = Number($(this).attr('id').split('_')[1]);
									$('.optionHasFocus').removeClass('optionHasFocus');
									$('#option_'+lookup.cur).addClass('optionHasFocus');
								});
								
								if(value.length === 0){
									$('#optionwrapper div[data-parent]').addClass('hidden');
									
									$('#optionwrapper div')
											.on('click', function(){
												lookup.cur = Number($(this).attr('id').split('_')[1]);
												$('.optionHasFocus').removeClass('optionHasFocus');
												$('#option_'+lookup.cur).addClass('optionHasFocus');
												lookup.selectOption(this);
												$('#optionwrapper').prev('input').focus();
											}).on('mousedown', function(e){
												e.preventDefault();
											});
								} else {
									$('#optionwrapper div[value]')
											.off('click')
											.on('click', function(){
												lookup.cur = Number($(this).attr('id').split('_')[1]);
												$('.optionHasFocus').removeClass('optionHasFocus');
												$('#option_'+lookup.cur).addClass('optionHasFocus');
												lookup.selectOption(this, true);
											}).on('mousedown', function(e){
												e.preventDefault();
											});
								}
							}
						});
					}
					lookupfield.cur = value;
				} else {
					switch(code){
						case 40://down
							event.preventDefault();
							if(lookup.cur === -1){
								lookup.cur = 0;
							} else {
								nextId = $('#optionwrapper div:not(.hidden)').eq( $('#optionwrapper div:not(.hidden)').index( $('.optionHasFocus') ) + 1 ).attr('id');
								if(nextId === undefined){
									lookup.cur = -1;
								} else {
									lookup.cur = Number(nextId.substr(nextId.lastIndexOf('_')+1));
								}
							}
							$('.optionHasFocus').removeClass('optionHasFocus');
							$('#option_'+lookup.cur).addClass('optionHasFocus');
							lookup.scrollOptionwrapper();
							return false;
						case 38://up
							event.preventDefault();
							if(lookup.cur === -1){
								prevId = $('#optionwrapper div:not(.hidden)').last().attr('id');
								lookup.cur = Number(prevId.substr(prevId.lastIndexOf('_')+1));
							} else {
								prevId = $('#optionwrapper div:not(.hidden)').eq( $('#optionwrapper div:not(.hidden)').index( $('.optionHasFocus') ) - 1 ).attr('id');
								if($('#optionwrapper :not(.hidden)').index($('.optionHasFocus')) === 0){
									lookup.cur = -1;
								} else {
									lookup.cur = Number(prevId.substr(prevId.lastIndexOf('_')+1));
								}
							}
							$('.optionHasFocus').removeClass('optionHasFocus');
							$('#option_'+lookup.cur).addClass('optionHasFocus');
							lookup.scrollOptionwrapper();
							return false;
						case 13://enter
						case 9://tab
							event.preventDefault();
							if(lookup.cur > -1){
								lookup.selectOption($('#option_'+lookup.cur));
							}
							break;
						case 27:
							lookup.doBlur();
					}
				}
			});
			lookup.doBlur = function(){
				if(document.hasFocus()){
					if(typeof $('#optionwrapper').siblings('input').val() !== 'undefined' && $('#optionwrapper').siblings('input').val().length > 0){
						var msg = 'Please select a value from the options';
						if($('#optionwrapper').parents('table').attr('data-new-url') !== undefined){
							msg = msg + ' or use the add new option';
						}
						//msg = msg + '. When clicking cancel your input will be removed from the field.'
						npdc.confirm(msg,
							function(){
								setTimeout(function(){$('#optionwrapper').siblings('input').focus();},100);
							},
							function(){
								$('#optionwrapper').siblings('input').val('');
								$('#optionwrapper').hide();
							},
							'Continue selecting',
							'Cancel and remove input'
						);
					} else {
						$('#optionwrapper').hide();
					}
				}
			};
			lookupfield.blur(function(){
				lookup.timer = setTimeout(function(){lookup.doBlur();},10);
			});
			
			lookupfield.focus(function(){
				$('#optionwrapper').show();
				lookup.positionOptionwrapper();
			});			
		}
	};

	$('.lookuptable,.multivalue').each(function(){
		var single = false;
		if($(this).hasClass('single')){
			var row = $(this).find('td');
			single = true;
		} else {
			$(this).data('newRowBaseId', $(this).find('[id$=_row_new]').attr('id'));
			$(this).data('clone', $('#'+$(this).data('newRowBaseId')).clone());
			$(this).data('newCount', 0);
			$(this).find('[id*=_row_new_]').each(function(){
				var c = parseInt($(this).attr('id').substring($(this).attr('id').lastIndexOf("_") + 1));
				if(c > $(this).parents('table').data('newCount')){
					$(this).parents('table').data('newCount', c);
				}
			});
			var row = $(this).find('[id$=_row_new]');
		}
		if($(this).hasClass('lookuptable')){
			initialize.lookuptable(row, single);
		}
	});
	$(window).on('scroll resize', function(){
		lookup.positionOptionwrapper();
	});
});
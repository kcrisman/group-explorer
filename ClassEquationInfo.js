// @flow
/*::
import Library from './js/Library.js';
import MathML from './js/MathML.js';
import Template from './js/Template.js';
import XMLGroup from './js/XMLGroup.js';

type SheetType = 'MTElement' | 'CGElement' | 'CDElement';
 */
$(window).on('load', load);	// like onload handler in body

var group /*: XMLGroup */;
function load() {
   Library.loadFromURL()
      .then( (_group) => {
         group = _group;
         formatGroup();
      } )
      .catch( console.error );
}

function formatGroup() {
   const $rslt = $(document.createDocumentFragment())
         .append(eval(Template.HTML('header')));
   if (group.isAbelian) {
      $rslt.append(eval(Template.HTML('abelian')));
   } else {
      $rslt.append(eval(Template.HTML('non-abelian')));
      for (const conjugacyClass of group.conjugacyClasses) {
         $rslt.find('#conjugacy_list')
            .append($('<li>').html(
               MathML.csList(conjugacyClass
                             .toArray()
                             .map( (el) => group.representation[el] )
                            )))
      }
   }
   $rslt.append(eval(Template.HTML('trailer')));
   $('body').prepend($rslt);
   MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'conjugacy_list']);

   setUpGAPCells();

   $( '.show-class-equation-sheet' ).on( 'click', function ( event ) {
      event.preventDefault();
      const target = ((event.target /*: any */) /*: HTMLElement */);
      const type = target.getAttribute( 'data-type' );
      showAsSheet( ((type /*: any */) /*: SheetType */) );
   } );
}

function formatClassEquation(group /*: XMLGroup */) /*: string */ {
   let classEquation;
   if (   group.order > 5
          && group.conjugacyClasses.every(function (el) { return el.popcount() == 1; })) {
      classEquation =
         eval('`' + '1 + 1 + ... (${group.order} times) ... + 1 = ${group.order}' + '`');
   } else {
      classEquation =
         group.conjugacyClasses
         .map(function (el) { return el.popcount(); })
         .join(' + ') +
         ' = ' + group.order;
   }
   return classEquation;
}

function fromRainbow ( index /*: number */ ) /*: color */ {
   return `hsl(${Math.floor( index * 360 / group.conjugacyClasses.length )}, 100%, 80%)`;
}
function addHighlights ( i /*: number */, array /*: ?Array<string> */ ) /*: Array<string> */ {
   if ( !array ) array = Array( group.order ).fill( '' );
   return array.map( ( e, j ) =>
                     group.conjugacyClasses[i].isSet( j ) ? fromRainbow( i ) : e );
}
function showAsSheet ( type /*: SheetType */ ) { // type must be one of MTElement, CGElement, CDElement
   const n = group.conjugacyClasses.length;
   // If the group is abelian, it may have an equation like
   // 1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1=17, which we want to abbreviate
   // as 1+1+1+...+1=17, so we have "fake" values of n and i:
   const fakeN = ( group.isAbelian && group.order > 5 ) ? 5 : n;
   // Add title at top of sheet
   var sheetElementsAsJSON = [
      {
         className : 'TextElement',
         x : 50, y : 50, w : 150*fakeN+100, h : 50,
         text : `Class Equation for the Group ${MathML.toUnicode(group.name)}`,
         fontSize : '20pt', alignment : 'center'
      }
   ];
   for ( var i = 0 ; i < fakeN ; i++ ) {
      const fakeIndex = ( fakeN == n ) ? i :
            ( i < 3 ) ? i : ( i == 3 ) ? -1 : n - 1;
      if ( fakeIndex == -1 ) { // draw the ellipses
         sheetElementsAsJSON.push( {
            className : 'TextElement',
            x : 50 + 150*i, y : 100, w : 100, h : 50,
            text : '...', alignment : 'center'
         } );
         sheetElementsAsJSON.push( {
            className : 'TextElement',
            x : 50 + 150*i, y : 187, w : 100, h : 50,
            text : '...', alignment : 'center'
         } );
      } else { // draw the acutal CC order and visualizer
         // Add each conjugacy class in two parts:
         // First, its order as an integer:
         sheetElementsAsJSON.push( {
            className : 'TextElement',
            x : 50 + 150*i, y : 100, w : 100, h : 50,
            text : `${group.conjugacyClasses[fakeIndex].popcount()}`,
            alignment : 'center'
         } );
         // Second, its visualization as highlighted elements in a visualizer:
         sheetElementsAsJSON.push( {
            className : type, groupURL : group.URL,
            x : 50 + 150*i, y : 150, w : 100, h : 100,
            highlights : { background : addHighlights( fakeIndex ) }
         } );
      }
      // Then add a "+" or an "=" in each of those two rows
      // (always a "+" until the last step, which should be an "="):
      sheetElementsAsJSON.push( {
         className : 'TextElement',
         x : 150 + 150*i, y : 100, w : 50, h : 50,
         text : ( fakeIndex < n - 1 ) ? '+' : '=', alignment : 'center'
      } );
      sheetElementsAsJSON.push( {
         className : 'TextElement',
         x : 150 + 150*i, y : 187, w : 50, h : 50,
         text : ( fakeIndex < n - 1 ) ? '+' : '=', alignment : 'center'
      } );
   }
   // Add the group order in the top row:
   sheetElementsAsJSON.push( {
      className : 'TextElement',
      x : 50 + 150*fakeN, y : 100, w : 100, h : 50,
      text : `${group.order}`,
      alignment : 'center'
   } );
   // And the entire group, with rainbow highlighting by conjugacy classes,
   // in the bottom row:
   var highlights = null;
   for ( var i = 0 ; i < n ; i++ ) highlights = addHighlights( i, highlights );
   sheetElementsAsJSON.push( {
      className : type, groupURL : group.URL,
      x : 50 + 150*fakeN, y : 150, w : 100, h : 100,
      highlights : { background : highlights }
   } );
   // Show it:
   CreateNewSheet( sheetElementsAsJSON );
}

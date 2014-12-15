import _ from 'lodash';
import Q from 'q';
import Base from './base.js';

export default _.extend({}, Base, {
  type: 'regexp',

  _render() {
    var matches = this.matches(),
        matchContainer;

    if (matches.length === 1) {
      return this.proxy(matches[0]);
    } else {
      matchContainer = this.container.group()
        .addClass('regexp-matches')
        .transform(Snap.matrix()
          .translate(20, 0));

      return Q.all(_.map(matches, match => {
        return match.render(matchContainer.group());
      }))
        .then((() => {
          var containerBox,
              paths;

          this.spaceVertically(matches, {
            padding: 5
          });

          containerBox = this.getBBox();
          paths = _.map(matches, this.makeConnectorLine.bind(this, containerBox));

          paths.push(this.makeSideLine(containerBox, _.first(matches)));
          paths.push(this.makeSideLine(containerBox, _.last(matches)));

          this.container.prepend(
            this.container.path(paths.join('')));

          matchContainer.prepend(
            matchContainer.path(_.map(matches, match => {
              return Snap.format('M0,{box.ay}h{box.ax}M{box.ax2},{box.ay}H{container.width}', {
                box: match.getBBox(),
                container: matchContainer.getBBox()
              });
            }).join('')));
        }).bind(this));
    }
  },

  makeSideLine(containerBox, match) {
    var box = match.getBBox(),
        direction = box.ay > containerBox.cy ? 1 : -1,
        distance = Math.abs(box.ay - containerBox.cy);

    if (distance >= 15) {
      return Snap.format([
        'M0,{box.cy}q10,0 10,{shift}V{edge}',
        'M{box.width},{box.cy}m40,0q-10,0 -10,{shift}V{edge}'
      ].join(''), {
        box: containerBox,
        edge: box.ay - 10 * direction,
        shift: 10 * direction
      });
    } else {
      return '';
    }
  },

  makeConnectorLine(containerBox, match) {
    var box = match.getBBox(),
        direction = box.ay > containerBox.cy ? 1 : -1,
        distance = Math.abs(box.ay - containerBox.cy),
        pathStr;

    if (distance >= 15) {
      pathStr = [
        'M10,{box.ay}m0,{shift}q0,{curve} 10,{curve}',
        'M{containerBox.width},{box.ay}m30,{shift}q0,{curve} -10,{curve}'
      ].join('');
    } else {
      pathStr = [
        'M0,{containerBox.cy}c10,0 10,{anchor.y} 20,{anchor.y}',
        'M{containerBox.width},{containerBox.cy}m40,0c-10,0 -10,{anchor.y} -20,{anchor.y}'
      ].join('');
    }

    return Snap.format(pathStr, {
      containerBox,
      box,
      shift: -10 * direction,
      curve: 10 * direction,
      anchor: {
        x: box.x + 20,
        y: box.ay - containerBox.cy
      }
    });
  },

  matches() {
    return [this._match].concat(_.map(this._alternates.elements, _.property('match')));
  }
});

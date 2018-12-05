import React, { Component } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import ListExample from './ListExample';
import ListAccExample from './ListAccExample';
import { Button } from 'react-native-paper';

const { height } = Dimensions.get('window');

const {
  set,
  onChange,
  cond,
  or,
  block,
  eq,
  greaterThan,
  add,
  multiply,
  spring,
  greaterOrEq,
  startClock,
  divide,
  stopClock,
  clockRunning,
  sub,
  lessThan,
  defined,
  Value,
  Clock,
  event,
  lessOrEq,
} = Animated;

class BottomSheetBehaviour extends Component {
  constructor(props) {
    super(props);
    const { toss, damping, mass, stiffness, snapPoints, initialSnapPoint } = props;
    const contentHeight = new Value(0);
    // Defining parametrised spring animation
    const runSpring = (clock, value, velocity, destination, position = new Value(0)) => {
      const state = {
        finished: new Value(0),
        velocity: new Value(0),
        position,
        time: new Value(0),
      };

      const config = {
        damping,
        mass,
        stiffness,
        overshootClamping: true,
        restSpeedThreshold: 0.1,
        restDisplacementThreshold: 0.01,
        toValue: destination,
      };

      return [
        cond(clockRunning(clock), 0, [
          set(state.finished, 0),
          set(state.velocity, velocity),
          set(state.position, value),
          startClock(clock),
        ]),
        spring(clock, state, config),
        cond(state.finished, stopClock(clock)),
        state.position,
      ];
    };
    // clock used for animations
    const clock = new Clock();

    // There's need to measure content in order to prevent scrolling on end reached
    this.onLayout = event => contentHeight.setValue(height - event.nativeEvent.layout.height);

    // Values passed from handler
    const translationY = new Value(0);
    const htranslationY = new Value(0);
    const contentOffset = new Value(0);
    const state = new Value(-1);
    const hstate = new Value(-1);
    const velocityY = new Value(0);

    // Gesture handler's method
    this.onGestureEvent = event([
      { nativeEvent: { translationY, velocityY, state } },
    ]);

    this.onHeaderGestureEvent = event([
      { nativeEvent: { translationY, velocityY,state: hstate } },
    ]);



    // These value are used for choosing next snapPoint
    const middlesOfSnapPoints = [];
    for (let i = 1; i < snapPoints.length; i++) {
      middlesOfSnapPoints.push(divide(add(snapPoints[i - 1] + snapPoints[i]), 2));
    }

    // movement defines current position of content
    const movement = new Value();
    const previousTranslationY = new Value(0);

    // destination point is a approximation of movement if finger released
    const destinationPoint = add(movement, multiply(toss, velocityY));

    // method for generating condition for finding the nearest snap point
    const currentSnapPoint = (i = 0) => i + 1 === snapPoints.length ?
      snapPoints[i] :
      cond(
        lessThan(destinationPoint, middlesOfSnapPoints[i]),
        snapPoints[i],
        currentSnapPoint(i + 1)
      );
    // current snap point desired
    const snapPoint = currentSnapPoint();


    // extra params for handling manual setting of value
    const manuallySetValue = new Value(0);
    const isManuallySetValue = new Value(0);

    // extra var for passing position of component released
    const inertiaMovement = new Value(0);



    // wrapper for defining bottom margin of component
    const handleBottomMargin = trans => cond(lessThan(trans, contentHeight), contentHeight, trans);

    const resultTranslateY =
        cond(
          eq(state, State.ACTIVE),
          // if handler if active
          [
            // mark no-manual handling
            set(isManuallySetValue, 0),
            // start animation behaviour
            stopClock(clock),
            // set movement with bottom limit
            set(movement,
              handleBottomMargin(add(movement, sub(translationY, previousTranslationY)))
            ),
            // capture offset
            set(previousTranslationY, translationY),
            // return movement
            movement,
          ],
          [
            // if handler is not active
            set(previousTranslationY, 0),
            set(
              movement,
              // check if first invoke (on very beginning)
              cond(defined(movement),
                // if not first
                [
                  // animate to
                  runSpring(clock, movement, velocityY,
                    // if set manually, animate to given value
                    cond(isManuallySetValue, manuallySetValue,
                      // if not move snap point.
                      // However allow for moving above first snap point.
                      // Hidden overflow covers this case
                      // Save result to inertiaMovement
                      cond(greaterOrEq(movement, snapPoints[0]), snapPoint, add(movement, multiply(toss, velocityY)))), inertiaMovement),
                  // and return inertiaMovement wth bottom limitation
                  handleBottomMargin(inertiaMovement)
                ],
                // if first, move to initial snap point on very beginning
                snapPoints[initialSnapPoint]
              )
            ),
          ]
        )
    // set manually snap point
    this.setSnap = index => {
      // set value
      manuallySetValue.setValue(snapPoints[index]);
      // and mark that's set manually
      isManuallySetValue.setValue(1);
    };

    // component follow movement. But stop on very first snap point
    this.componentMovements = cond(greaterThan(resultTranslateY, snapPoints[0]), resultTranslateY, snapPoints[0]);
    // content moves only when first snap point is reached
    this.contentMovement = cond(greaterThan(resultTranslateY, snapPoints[0]), multiply(1, contentOffset), sub(resultTranslateY, snapPoints[0], contentOffset));

  }

  render() {
    const { children, containerStyle: style, renderHeader, ...rest } = this.props;
    return (
      <Animated.View
        style={{
          width: '100%', position: 'absolute', overflow: 'hidden',
          transform: [{
            translateY: this.componentMovements
          }]
        }}
      >
        <PanGestureHandler
          {...rest}
          onGestureEvent={this.onGestureEvent}
          onHandlerStateChange={this.onHeaderGestureEvent}>
          <Animated.View
            style={{
              zIndex: 1,
            }}
          >
            {renderHeader && renderHeader()}
          </Animated.View>
        </PanGestureHandler>
        <PanGestureHandler
          {...rest}
          onGestureEvent={this.onGestureEvent}
          onHandlerStateChange={this.onGestureEvent}>
          <Animated.View
            onLayout={this.onLayout}
            style={{
              transform: [{
                translateY: this.contentMovement
              }],
              height: '100%',
            }}
          >
            {children}
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    )
      ;
  }
}

BottomSheetBehaviour.defaultProps = {
  toss: 0.01,
  damping: 20,
  mass: 2,
  stiffness: 130.6,
  initialSnapPoint: 0,
};


export default class Example extends Component {
  static navigationOptions = {
    title: 'BottomSheetBehaviour Example',
  };
  BSB = React.createRef();
  _renderHeader = () =>
    <View style={{ height: 32, backgroundColor: '#6200ee' }}/>;

  render() {
    return (
      <View style={styles.container}
      >
        <Button onPress={() => this.BSB.current.setSnap(2)}/>
        <ListAccExample/>
        <BottomSheetBehaviour
          ref={this.BSB}
          containerStyle={styles.innerContainer}
          snapPoints={[100, 300, 500]}
          renderHeader={this._renderHeader}
        >
          <ListExample/>
        </BottomSheetBehaviour>
      </View>
    );
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  innerContainer: {
    position: 'absolute',
    width: '100%',
    height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  }
});

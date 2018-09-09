import * as React from 'react';
import { ScrollView, StyleSheet, View, Image } from 'react-native';
import { List, Divider, withTheme, Surface, Appbar } from 'react-native-paper';
import type { Theme } from 'react-native-paper/types';

type Props = {
  theme: Theme,
};

class ListAccordionExample extends React.Component<Props> {
  static title = 'List.Accordion';

  render() {
    const {
      theme: {
        colors: { background },
      },
    } = this.props;
    return (
      <Surface style={styles.container}>
        <List.Section title="Single line">
          <List.Item
            left={props => <List.Icon {...props} icon="event" />}
            title="List item 1"
          />
          <List.Item
            left={props => <List.Icon {...props} icon="redeem" />}
            title="List item 2"
          />
        </List.Section>
        <Divider />
        <List.Section title="Two line">
          <List.Item
            left={() => (
              <Image
                source={require('./email-icon.png')}
                style={styles.image}
              />
            )}
            title="List item 1"
            description="Describes item 1"
          />
          <List.Item
            left={() => (
              <Image
                source={require('./email-icon.png')}
                style={styles.image}
              />
            )}
            right={props => <List.Icon {...props} icon="info" />}
            title="List item 2"
            description="Describes item 2"
          />
        </List.Section>
        <Divider />
        <List.Section title="Three line">
          <List.Item
            left={() => (
              <Image
                source={require('./email-icon.png')}
                style={styles.image}
              />
            )}
            title="List item 1"
            description="Describes item 1. Example of a very very long description."
          />
          <List.Item
            left={() => (
              <Image
                source={require('./email-icon.png')}
                style={styles.image}
              />
            )}
            right={props => <List.Icon {...props} icon="star-border" />}
            title="List item 2"
            description="Describes item 2. Example of a very very long description."
          />
        </List.Section>
      </Surface>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
});

export default withTheme(ListAccordionExample);
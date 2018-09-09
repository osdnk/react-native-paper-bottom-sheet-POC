import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Divider, withTheme } from 'react-native-paper';
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
      <View style={[styles.container, { backgroundColor: background }]}>
        <List.Section title="Expandable list item">
          <List.Accordion
            left={props => <List.Icon {...props} icon="folder" />}
            title="Expandable list item"
          >
            <List.Item title="List item 1" />
            <List.Item title="List item 2" />
          </List.Accordion>
        </List.Section>
        <Divider />
        <List.Section title="Expandable & multiline list item">
          <List.Accordion
            title="Expandable list item"
            description="Describes the expandable list item"
          >
            <List.Item title="List item 1" />
            <List.Item title="List item 2" />
          </List.Accordion>
        </List.Section>
        <Divider />
        <List.Section title="Expandable list with icons">
          <List.Accordion
            left={props => <List.Icon {...props} icon="star" />}
            title="Accordion item 1"
          >
            <List.Item
              left={props => <List.Icon {...props} icon="thumb-up" />}
              title="List item 1"
            />
            <List.Item
              left={props => <List.Icon {...props} icon="thumb-down" />}
              title="List item 2"
            />
          </List.Accordion>
        </List.Section>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%'
  },
});

export default withTheme(ListAccordionExample);

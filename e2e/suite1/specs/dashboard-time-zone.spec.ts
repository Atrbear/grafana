import { e2e } from '@grafana/e2e';

e2e.scenario({
  describeName: 'Dashboard time zone support',
  itName: 'Tests dashboard time zone scenarios',
  addScenarioDataSource: false,
  addScenarioDashBoard: false,
  skipScenario: false,
  scenario: () => {
    e2e.flows.openDashboard({ uid: '5SdHCasdf' });

    const fromTimeZone = 'UTC';
    const toTimeZone = 'America/Chicago';
    const offset = offsetBetweenTimeZones(toTimeZone, fromTimeZone);

    const panelsToCheck = [
      'Random walk series',
      'Millisecond res x-axis and tooltip',
      '2 yaxis and axis labels',
      'Stacking value ontop of nulls',
      'Null between points',
      'Legend Table No Scroll Visible',
    ];

    const timesInUtc: Record<string, string> = {};

    for (const title of panelsToCheck) {
      e2e.components.Panels.Panel.containerByTitle(title)
        .should('be.visible')
        .within(() =>
          e2e.components.Panels.Visualization.Graph.xAxis
            .labels()
            .should('be.visible')
            .last()
            .should((element) => {
              timesInUtc[title] = element.text();
            })
        );
    }

    e2e.components.PageToolbar.item('Dashboard settings').click();

    e2e.components.TimeZonePicker.container()
      .should('be.visible')
      .within(() => {
        e2e.components.Select.singleValue().should('be.visible').should('have.text', 'Coordinated Universal Time');
        e2e.components.Select.input().should('be.visible').click();

        e2e.components.Select.option().should('be.visible').contains(toTimeZone).click();
      });

    e2e.components.BackButton.backArrow().click();

    for (const title of panelsToCheck) {
      e2e.components.Panels.Panel.containerByTitle(title)
        .should('be.visible')
        .within(() =>
          e2e.components.Panels.Visualization.Graph.xAxis
            .labels()
            .should('be.visible')
            .last()
            .should((element) => {
              const utc = timesInUtc[title];
              const tz = element.text();
              const isCorrect = isTimeCorrect(utc, tz, offset);
              assert.isTrue(isCorrect, `Panel with title: "${title}"`);
            })
        );
    }
  },
});

const isTimeCorrect = (utc: string, tz: string, offset: number): boolean => {
  const minutes = 1000 * 60;

  const a = Cypress.moment(utc, 'HH:mm').set('seconds', 0).set('milliseconds', 0);

  const b = Cypress.moment(tz, 'HH:mm').set('seconds', 0).set('milliseconds', 0).add('hours', offset);

  return a.diff(b, 'minutes') <= 6 * minutes;
};

const offsetBetweenTimeZones = (timeZone1: string, timeZone2: string, when: Date = new Date()): number => {
  const t1 = convertDateToAnotherTimeZone(when, timeZone1);
  const t2 = convertDateToAnotherTimeZone(when, timeZone2);
  return (t1.getTime() - t2.getTime()) / (1000 * 60 * 60);
};

const convertDateToAnotherTimeZone = (date: Date, timeZone: string): Date => {
  const dateString = date.toLocaleString('en-US', {
    timeZone: timeZone,
  });
  return new Date(dateString);
};

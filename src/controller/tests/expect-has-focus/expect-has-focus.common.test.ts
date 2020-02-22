import * as SUT from '../../controller';

describe('Playwright Controller - expect has focus', (): void => {
  let pwc: SUT.PlaywrightController;
  beforeEach((): void => {
    jest.setTimeout(30000);
    pwc = new SUT.PlaywrightController();
  });
  afterEach(
    async (): Promise<void> => {
      await pwc.close();
    },
  );

  test('should give back an error on expectThat.hasFocus when browser has not been launched', async (): Promise<
    void
  > => {
    // Given

    // When
    let result: Error | undefined = undefined;
    try {
      await pwc.expectThat('foobar').hasFocus();
    } catch (error) {
      result = error;
    }

    // Then
    expect(result && result.message).toContain(
      "Cannot get the focus state of 'foobar' because no browser has been launched",
    );
  });
});
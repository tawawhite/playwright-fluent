import * as SUT from '../index';
import { Page } from 'playwright';

describe('paste text', (): void => {
  test('should return an error when browser has not been launched', async (): Promise<void> => {
    // Given
    const page: Page | undefined = undefined;

    // When
    // Then
    const expectedError = new Error('Cannot paste text because no browser has been launched');
    await SUT.pasteText('foobar', page, SUT.defaultPasteTextOptions).catch((error): void =>
      expect(error).toMatchObject(expectedError),
    );
  });
});
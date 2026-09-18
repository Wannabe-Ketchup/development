import { buildMusicUrls } from './load-s3-music.service';

describe('buildMusicUrls', () => {
  it('디렉터리를 제외한 음악 파일의 CDN URL을 생성한다', () => {
    // given
    const cdnDomain = 'https://cdn.example.com';
    const contents = [
      { Key: 'music/' },
      { Key: 'music/music1.mp3' },
      { Key: 'music/music2.mp3' },
    ];
    const expectedUrls = [`${cdnDomain}/music1.mp3`, `${cdnDomain}/music2.mp3`];

    // when
    const result = buildMusicUrls(contents, cdnDomain);

    // then
    expect(result).toEqual(expectedUrls);
  });
});

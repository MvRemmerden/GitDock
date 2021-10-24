# Development and design challenges

While working on GitDock, we want to document all major challenges and
roadblocks that we encounter during the development of the app. This will
help us and GitLab’s designers to directly see typical areas where users
would struggle.

## Tests and ChromeDriver in CI

When we initially set up end-to-end tests using electron’s
[spectron][spectron] test framework, it was very hard to set up the
tests to run in the pipeline (see @mvanremmerden’s efforts in
[!21][mr21]). It turns out that [ChromeDriver][chromedriver] (the tool
to use Chrome for automated browser tests) together with spectron
required many dependencies and programs that were not installed in the
standard Docker image `node`. That image is commonly used for
JavaScript-based tests like ours (see the `tests/` directory). We had to
install additional programs, including Google Chrome and chromedriver:

```yaml
feature-tests:
  # ... omitted job config ...
  script:
    # Download Google Chrome
    - wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
    # Install additional programs
    - apt-get update && DEBIAN_FRONTEND=noninteractive apt-get -y install ./google-chrome-stable_current_amd64.deb xorg xvfb gtk2-engines-pixbuf dbus-x11 xfonts-cyrillic
    # Download chromedriver and make it executable
    - wget https://chromedriver.storage.googleapis.com/2.41/chromedriver_linux64.zip
    - unzip chromedriver_linux64.zip
    - mv chromedriver /usr/bin/chromedriver
    - chown root:root /usr/bin/chromedriver
    - chmod +x /usr/bin/chromedriver
    # Start Xvfb (virtual X-Server, not required on your local machine)
    - Xvfb -ac :99 -screen 0 1280x1024x16 &
    # Set the display ID for chromedriver
    - export DISPLAY=:99
    - npm test
```

Installing these programs is a repetitive task that isn’t related to
GitDock though. That is why we [decided][decision-image] to use a custom
Docker image (see the [`spectron-ci`][custom-image] image).

[spectron]: https://www.electronjs.org/spectron
[mr21]: https://gitlab.com/mvanremmerden/gitdock/-/merge_requests/21
[chromedriver]: https://chromedriver.chromium.org/home
[decision-image]: https://gitlab.com/mvanremmerden/gitdock/-/merge_requests/28#note_709251012
[custom-image]: https://gitlab.com/codingpaws/docker/spectron-ci

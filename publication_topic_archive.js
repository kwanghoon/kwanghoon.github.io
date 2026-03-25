(function () {
  function textOf(html) {
    var div = document.createElement('div');
    div.innerHTML = html || '';
    return (div.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function normalizeForMatch(text) {
    return textOf(text).toLowerCase();
  }

  function findYear(text) {
    var matches = text.match(/(19|20)\d{2}/g);
    if (!matches || !matches.length) {
      return 'Unknown';
    }
    return matches[matches.length - 1];
  }

  function startEntry(node) {
    var h3 = node.tagName === 'A' ? node.querySelector('h3') : node;
    if (!h3) {
      return null;
    }

    return {
      anchor: node.tagName === 'A' ? (node.getAttribute('name') || '') : '',
      titleHtml: h3.innerHTML.trim(),
      titleText: textOf(h3.innerHTML),
      metaHtml: '',
      paragraphs: [],
      availableHtml: '',
      tags: []
    };
  }

  function createKeywordRules() {
    return [
      { label: 'LLM', patterns: [/\bllm\b/, /large language model/, /대형언어모델/] },
      { label: 'AI', patterns: [/\bai\b/, /artificial intelligence/, /인공지능/, /딥러닝/, /neural network/, /신경망/] },
      { label: 'Static Analysis', patterns: [/static analysis/, /정적 분석/, /string analysis/, /code property graph/, /\bcpg\b/] },
      { label: 'Dynamic Analysis', patterns: [/dynamic analysis/, /동적 분석/] },
      { label: 'Fuzzing', patterns: [/fuzzing/, /\bfuzzer\b/, /fuzz test/, /퍼징/, /퍼저/] },
      { label: 'Android', patterns: [/android/, /안드로이드/, /\bintent\b/] },
      { label: 'IoT', patterns: [/\biot\b/, /사물 인터넷/, /internet of things/, /home automation/] },
      { label: 'SmartThings', patterns: [/smartthings/, /smartapp/, /smartapps/] },
      { label: 'Security', patterns: [/security/, /보안/, /취약점/, /vulnerability/, /cve/, /악성코드/, /malicious/] },
      { label: 'Web', patterns: [/\bweb\b/, /browser/, /html/, /웹 취약점/, /웹 프로그램/] },
      { label: 'Code Completion', patterns: [/code completion/, /syntax completion/, /자동 완성/, /문법 완성/] },
      { label: 'LR Parsing', patterns: [/lr parsing/, /lr parser/, /\blr\b/, /오토마타/, /parser specification/] },
      { label: 'Parser Generation', patterns: [/parser generator/, /파서 생성/, /parser tool/, /파서 명세/] },
      { label: 'Compiler', patterns: [/compiler/, /compilation/, /컴파일/, /compiler tool/] },
      { label: 'LLVM', patterns: [/llvm/] },
      { label: 'Type Systems', patterns: [/type system/, /typed /, / typing /, /^typing /, /타입 시스템/, /type and effect/, /\bgadt\b/] },
      { label: 'RPC', patterns: [/\brpc\b/, /client-server/, /클라이언트-서버/] },
      { label: 'Multitier', patterns: [/multitier/, /multi-tier/, /다중 계층/, /polymorphic location/] },
      { label: 'Actor', patterns: [/actor model/, /actor programming/, /액터 모델/, /액터/] },
      { label: 'Formal Semantics', patterns: [/formal semantics/, /semantic correctness/, /type soundness/, /의미론/, /정당성/, /soundness/, /calculus/] },
      { label: 'Visualization', patterns: [/visualisation/, /visualization/, /visual block/, /diagram/, /시각화/, /블록 언어/] },
      { label: 'Declarative Web', patterns: [/declarative html/, /declarative language/, /선언적 언어/, /html document state/, /client-side browser/] },
      { label: 'Protocol Testing', patterns: [/protocol/, /sms pdu/, /검증 방법/, /verification scheme/] },
      { label: 'BLE', patterns: [/\bble\b/, /bluetooth low energy/] },
      { label: 'NFC', patterns: [/\bnfc\b/] },
      { label: 'Haskell', patterns: [/haskell/, /quickcheck/] },
      { label: 'Robustness', patterns: [/robustness/, /견고성/, /unexpected exceptions/] },
      { label: 'Smart Home', patterns: [/smart home/, /스마트 홈/] },
      { label: 'Krivine', patterns: [/krivine/, /zinc machine/, /push-enter/] }
    ];
  }

  function extractTags(entry, keywordRules) {
    var source = normalizeForMatch([
      entry.titleText,
      textOf(entry.metaHtml),
      entry.paragraphs.map(textOf).join(' ')
    ].join(' '));

    return keywordRules.filter(function (rule) {
      return rule.patterns.some(function (pattern) {
        return pattern.test(source);
      });
    }).map(function (rule) {
      return rule.label;
    });
  }

  function updateTagStyles(tagsRoot, activeTag) {
    Array.from(tagsRoot.querySelectorAll('a[data-tag]')).forEach(function (link) {
      var isActive = link.getAttribute('data-tag') === activeTag;
      link.style.background = isActive ? 'var(--primary)' : '';
      link.style.color = isActive ? '#ffffff' : '';
      link.style.borderColor = isActive ? 'var(--primary)' : '';
      link.style.textDecoration = 'none';
    });
  }

  window.initPublicationTopicArchive = function (config) {
    var legacy = document.getElementById(config.legacyId);
    var groupsRoot = document.getElementById(config.groupsId);
    var statsRoot = document.getElementById(config.statsId);
    var tagsRoot = document.getElementById(config.tagsId);
    if (!legacy || !groupsRoot || !statsRoot || !tagsRoot) {
      return;
    }

    var keywordRules = createKeywordRules().concat(config.extraKeywordRules || []);
    var entries = [];
    var current = null;

    Array.from(legacy.childNodes).forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var text = node.textContent.replace(/\s+/g, ' ').trim();
        if (text && current && !current.metaHtml) {
          current.metaHtml = text;
        }
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      var tag = node.tagName;
      var hasH3 = tag === 'H3' || (tag === 'A' && node.querySelector('h3'));
      if (hasH3) {
        if (current) {
          entries.push(current);
        }
        current = startEntry(node);
        return;
      }

      if (!current) {
        return;
      }

      if (tag === 'P') {
        current.paragraphs.push(node.innerHTML.trim());
      } else if (tag === 'H4') {
        current.availableHtml = node.innerHTML.trim();
      } else if (tag === 'HR') {
        entries.push(current);
        current = null;
      } else {
        var extra = node.innerHTML ? node.innerHTML.trim() : '';
        if (extra && !current.metaHtml) {
          current.metaHtml = extra;
        }
      }
    });

    if (current) {
      entries.push(current);
    }

    entries = entries.filter(function (entry) {
      return entry && entry.titleText;
    }).map(function (entry) {
      entry.tags = extractTags(entry, keywordRules);
      return entry;
    });

    var byYear = {};
    var tagCounts = {};

    entries.forEach(function (entry) {
      var year = findYear((entry.titleText + ' ' + textOf(entry.metaHtml)).trim());
      if (!byYear[year]) {
        byYear[year] = [];
      }
      byYear[year].push(entry);

      entry.tags.forEach(function (tag) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    var years = Object.keys(byYear).sort(function (a, b) {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return parseInt(b, 10) - parseInt(a, 10);
    });

    var total = entries.length;
    var activeTag = 'All';
    var yearSections = [];

    function updateStats(visibleCount, visibleYears) {
      statsRoot.innerHTML = '<li>Total publications: ' + total + '</li>' +
        '<li>Visible publications: ' + visibleCount + '</li>' +
        '<li>Years visible: ' + visibleYears + '</li>' +
        '<li>Active tag: ' + (activeTag === 'All' ? 'All topics' : activeTag) + '</li>';
    }

    function applyFilter(tag) {
      activeTag = tag || 'All';
      var visibleCount = 0;
      var visibleYears = 0;

      yearSections.forEach(function (item) {
        var matches = 0;
        Array.from(item.list.children).forEach(function (li) {
          var tags = (li.getAttribute('data-tags') || '').split('|').filter(Boolean);
          var visible = activeTag === 'All' || tags.indexOf(activeTag) !== -1;
          li.style.display = visible ? '' : 'none';
          if (visible) {
            matches += 1;
            visibleCount += 1;
          }
        });

        item.section.style.display = matches ? '' : 'none';
        if (matches) {
          visibleYears += 1;
        }
      });

      updateStats(visibleCount, visibleYears);
      updateTagStyles(tagsRoot, activeTag);
    }

    function createTopTagLink(label, count) {
      var link = document.createElement('a');
      link.href = '#';
      link.setAttribute('data-tag', label);
      link.textContent = label + ' (' + count + ')';
      link.addEventListener('click', function (event) {
        event.preventDefault();
        applyFilter(label);
      });
      return link;
    }

    groupsRoot.innerHTML = '';
    years.forEach(function (year) {
      var section = document.createElement('div');
      section.className = 'section';
      section.style.marginBottom = '0.9rem';

      var title = document.createElement('h2');
      title.textContent = year === 'Unknown' ? 'Year Not Specified' : year;
      section.appendChild(title);

      var list = document.createElement('ul');
      list.className = 'pub-list';

      byYear[year].forEach(function (entry) {
        var li = document.createElement('li');
        if (entry.anchor) {
          li.id = entry.anchor;
        }
        li.setAttribute('data-tags', entry.tags.join('|'));

        var itemTitle = document.createElement('div');
        itemTitle.innerHTML = '<strong>' + entry.titleHtml + '</strong>';
        li.appendChild(itemTitle);

        if (entry.metaHtml) {
          var meta = document.createElement('div');
          meta.style.marginTop = '0.2rem';
          meta.innerHTML = entry.metaHtml;
          li.appendChild(meta);
        }

        if (entry.tags.length) {
          var tagRow = document.createElement('div');
          tagRow.className = 'tag-links';
          tagRow.style.marginTop = '0.35rem';
          entry.tags.forEach(function (tag) {
            var tagLink = document.createElement('a');
            tagLink.href = '#';
            tagLink.textContent = tag;
            tagLink.addEventListener('click', function (event) {
              event.preventDefault();
              applyFilter(tag);
            });
            tagRow.appendChild(tagLink);
          });
          li.appendChild(tagRow);
        }

        if (entry.availableHtml || entry.paragraphs.length) {
          var details = document.createElement('details');
          details.style.marginTop = '0.35rem';

          var summary = document.createElement('summary');
          summary.textContent = 'Abstract / Links';
          details.appendChild(summary);

          entry.paragraphs.forEach(function (paragraphHtml) {
            var paragraph = document.createElement('p');
            paragraph.style.margin = '0.45rem 0 0';
            paragraph.innerHTML = paragraphHtml;
            details.appendChild(paragraph);
          });

          if (entry.availableHtml) {
            var available = document.createElement('p');
            available.style.margin = '0.45rem 0 0';
            available.innerHTML = entry.availableHtml;
            details.appendChild(available);
          }

          li.appendChild(details);
        }

        list.appendChild(li);
      });

      section.appendChild(list);
      groupsRoot.appendChild(section);
      yearSections.push({ section: section, list: list });
    });

    tagsRoot.innerHTML = '';
    tagsRoot.appendChild(createTopTagLink('All', total));
    Object.keys(tagCounts).sort(function (a, b) {
      var countDiff = tagCounts[b] - tagCounts[a];
      if (countDiff !== 0) {
        return countDiff;
      }
      return a.localeCompare(b);
    }).forEach(function (tag) {
      tagsRoot.appendChild(createTopTagLink(tag, tagCounts[tag]));
    });

    applyFilter(config.defaultTag || 'All');
  };
})();
"use client";

function parseLine(line: string) {
  const parts: React.ReactNode[] = [];
  let rest = line;
  while (rest.length > 0) {
    const bold = rest.match(/^\*\*(.+?)\*\*/);
    if (bold) {
      parts.push(<strong key={parts.length} className="font-semibold">{bold[1]}</strong>);
      rest = rest.slice(bold[0].length);
    } else {
      const idx = rest.indexOf("**");
      if (idx === -1) {
        parts.push(rest);
        break;
      }
      parts.push(rest.slice(0, idx));
      rest = rest.slice(idx);
    }
  }
  return parts;
}

export function ContentRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-2 my-4 text-gray-600">
          {listItems.map((item, i) => (
            <li key={i}>{parseLine(item.replace(/^-\s*/, ""))}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={key++} className="text-xl font-display font-bold text-gray-900 mt-8 mb-3 first:mt-0">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={key++} className="text-lg font-semibold text-gray-900 mt-6 mb-2">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith("- ")) {
      listItems.push(trimmed);
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-gray-600 leading-relaxed mb-3">
          {parseLine(trimmed)}
        </p>
      );
    }
  }
  flushList();

  return <div className="prose-custom">{elements}</div>;
}

import { Fragment } from 'react';
import { breadcrumbsForPath } from './nav';
import styles from './Breadcrumbs.module.css';

interface BreadcrumbsProps {
  path: string;
}

/** Accessible breadcrumb trail derived from the current route. Last crumb is current page. */
export function Breadcrumbs({ path }: BreadcrumbsProps) {
  const crumbs = breadcrumbsForPath(path);
  return (
    <nav aria-label="Breadcrumb" className={styles.nav}>
      <ol className={styles.list}>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.href}-${crumb.label}`} className={styles.item}>
              {index > 0 && (
                <span aria-hidden="true" className={styles.separator}>
                  /
                </span>
              )}
              {isLast ? (
                <span aria-current="page" className={styles.current}>
                  {crumb.label}
                </span>
              ) : (
                <Fragment>
                  <a href={crumb.href} className={styles.link}>
                    {crumb.label}
                  </a>
                </Fragment>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

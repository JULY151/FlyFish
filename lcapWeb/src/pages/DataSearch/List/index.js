/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  CWTable,
  Input,
  Button,
  Select,
  message,
  Popconfirm,
  Icon,
  Empty,
  Tooltip,
  Dropdown,
  Menu,
  Modal,
} from '@chaoswise/ui';
import { observer, loadingStore, toJS } from '@chaoswise/cw-mobx';
import store from './model/index';
import { formatDateNoTime } from '@/config/global';

import { successCode } from '@/config/global';
import styles from './assets/style.less';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  dataSearchTypeEnums,
  dataSearchGroupTypeEnums,
  dataSearchTypeMappings,
} from '../constants/enum';

const AppProjectManage = observer((props) => {
  const intl = useIntl();
  const {
    getDataList,
    setSearchParams,
    searchParams,
    setCurPage,
    setpageSize,
    deleteData,
    setActiveData,
  } = store;
  const { total, pageNo, pageSize, DataList } = store;
  const loading = loadingStore.loading['DataSearchList/getDataList'];
  // 表格列表数据
  let basicTableListData = toJS(DataList);
  // 表格列配置信息
  const columns = [
    {
      title: '查询名称',
      dataIndex: 'queryName',
      width: '20%',
      key: 'queryName',
      render: (text, record) => {
        return (
          <Tooltip title={text} placement='topLeft'>
            <a
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setActiveData(record);
                if (record.queryType == dataSearchTypeMappings.basic.id) {
                  props.history.push({
                    pathname: `/data-search/${record.settingId}/edit`,
                    state:{name:record.queryName}
                  });
                } else {
                  props.history.push({
                    pathname: `/data-search/${record.settingId}/edit-group-search`,
                    state: {
                      name: record.queryName,
                    },
                  });
                }
              }}
            >
              {text}
            </a>
          </Tooltip>
        );
      },
    },
    {
      title: '所属数据源',
      width: '35%',
      dataIndex: 'datasourceName',
      key: 'datasourceName',
      render(datasourceName) {
        if (datasourceName && datasourceName.length > 15) {
          return (
            <Tooltip title={datasourceName}>
              <span className='TableTopTitle'>{datasourceName}</span>
            </Tooltip>
          );
        }
        return datasourceName;
      },
    },
    {
      title: '查询类型',
      dataIndex: 'queryType',
      key: 'queryType',
      render(type) {
        let targetType = dataSearchTypeEnums.find((t) => t.id === type);
        return targetType ? intl.formatMessage(targetType.label) : '';
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      render(updateTime) {
        return formatDateNoTime(updateTime);
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render(createTime) {
        return formatDateNoTime(createTime);
      },
    },
    {
      title: intl.formatMessage({
        id: 'common.actions',
        defaultValue: '操作',
      }),
      dataIndex: 'actions',
      key: 'actions',
      width: 200,
      render(text, record, index) {
        return (
          <span className={styles.projectActionList}>
            {!record.deleted ? (
              <a
                className={styles.projectAction}
                onClick={() => {
                  Modal.confirm({
                    content: intl.formatMessage({
                      id: 'pages.dataSearch.deleteConfirmMessage',
                      defaultValue:
                        '如果查询已关联应用，删除后应用内组件将展示异常',
                    }),
                    className: styles.deleteModal,
                    onOk: () => {
                      deleteData(record, (res) => {
                        if (res.code === successCode) {
                          getDataList({}, (res) => {
                            if (
                              res.data &&
                              res.data.length == 0 &&
                              res.pageNo != 0
                            ) {
                              getDataList({ pageNo: 1 });
                            }
                          });
                          message.success(
                            intl.formatMessage({
                              id: 'common.deleteSuccess',
                              defaultValue: '删除成功！',
                            })
                          );
                        } else {
                          message.error(
                            res.msg ||
                              intl.formatMessage({
                                id: 'common.deleteError',
                                defaultValue: '删除失败，请稍后重试！',
                              })
                          );
                        }
                      });
                    },
                  });
                }}
              >
                <FormattedMessage id='common.delete' defaultValue='删除' />
              </a>
            ) : null}
          </span>
        );
      },
    },
  ];
  const searchContent = [
    {
      components: (
        <Select
          id='queryType'
          key='queryType'
          allowClear
          style={{ width: '160px' }}
          placeholder={intl.formatMessage({
            id: 'pages.dataSearch.pleaseSelectTypePlaceholder',
            defaultValue: '请选择查询类型',
          })}
        >
          {dataSearchTypeEnums.map((dataSearchTypeEnum) => {
            return (
              <Select.Option
                key={dataSearchTypeEnum.id}
                value={dataSearchTypeEnum.id}
              >
                <FormattedMessage {...dataSearchTypeEnum.label} />
              </Select.Option>
            );
          })}
        </Select>
      ),
      formAttribute: { initialValue: searchParams.queryType },
    },
    {
      components: (
        <Input
          id='queryName'
          key='queryName'
          allowClear
          style={{ width: '200px' }}
          suffix={<Icon type='search' />}
          placeholder={intl.formatMessage({
            id: 'pages.dataSearch.searchInputPlaceholder',
            defaultValue: '请输入查询名称',
          })}
        />
      ),
      formAttribute: { initialValue: searchParams.queryName || '' },
    },
    {
      components: (
        <Input
          id='datasourceName'
          key='datasourceName'
          allowClear
          style={{ width: '200px' }}
          suffix={<Icon type='search' />}
          placeholder={intl.formatMessage({
            id: 'pages.dataSearch.searchInputSourceNamePlaceholder',
            defaultValue: '请输入所属数据源名称',
          })}
        />
      ),
      formAttribute: { initialValue: searchParams.datasourceName || '' },
    },
  ];
  // 请求列表数据
  useEffect(() => {
    getDataList();
  }, []);
  // 分页、排序、筛选变化时触发
  const onPageChange = (pageNo, pageSize) => {
    getDataList({ pageNo: pageNo, pageSize });
  };
  const onSearch = (params) => {
    setSearchParams(params);
    setCurPage(1);
    getDataList({}, (data, res) => {
      if (res.code !== successCode) {
        res.msg && message.error(res.msg);
      }
    });
  };

  return (
    <div className={styles.pegeDataSearch}>
      <CWTable
        columns={columns}
        dataSource={basicTableListData}
        rowKey={(record) => record.settingId}
        loading={loading}
        pagination={{
          showTotal: true,
          total: Number(total),
          current: pageNo,
          pageSize: pageSize,
          onChange: onPageChange,
          onShowSizeChange: onPageChange,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        locale={{
          emptyText: <Empty />,
        }}
        searchBar={{
          onSearch: onSearch,
          showSearchCount: 3,
          extra: () => {
            return [
              <Button
                type='primary'
                key='create_basic_data_search'
                onClick={() => {
                  setActiveData({});
                  props.history.push('/data-search/create');
                }}
              >
                <FormattedMessage
                  id='pages.dataSearch.createBasic'
                  defaultValue='新建基础查询'
                />
              </Button>,
              <Dropdown
                key='create_group_data_search'
                trigger={['click']}
                overlay={
                  <Menu>
                    {dataSearchGroupTypeEnums.map((dataSearchGroupTypeEnum) => {
                      return (
                        <Menu.Item
                          onClick={() => {
                            props.history.push({
                              pathname: `/data-search/create-group-search/${dataSearchGroupTypeEnum.id}`,
                              state: {
                                name: intl.formatMessage(
                                  dataSearchGroupTypeEnum.label
                                ),
                              },
                            });
                          }}
                          key={dataSearchGroupTypeEnum.id}
                        >
                          <div className={styles.dataSearchGroupTypeEnumWrap}>
                            <span
                              className={styles.dataSearchGroupTypeEnumLabel}
                            >
                              <FormattedMessage
                                {...dataSearchGroupTypeEnum.label}
                              />
                            </span>
                            <span
                              className={styles.dataSearchGroupTypeEnumIcon}
                            >
                              {dataSearchGroupTypeEnum.desc ? (
                                <Tooltip
                                  placement='left'
                                  title={intl.formatMessage(
                                    dataSearchGroupTypeEnum.desc
                                  )}
                                >
                                  <Icon type='question-circle' />
                                </Tooltip>
                              ) : (
                                ''
                              )}
                            </span>
                          </div>
                        </Menu.Item>
                      );
                    })}
                  </Menu>
                }
              >
                <Button>
                  新建组合查询 <Icon type='down' />
                </Button>
              </Dropdown>,
            ];
          },
          searchContent: searchContent,
        }}
      ></CWTable>
    </div>
  );
});
export default AppProjectManage;

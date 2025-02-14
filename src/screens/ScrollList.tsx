import {View, Text, TouchableOpacity, FlatList} from 'react-native';
import React, {useEffect, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList, SearchStackParamList} from '../App';
import {Post} from '../lib/providers/types';
import {Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Skeleton} from 'moti/skeleton';
import {MotiView} from 'moti';
import useContentStore from '../lib/zustand/contentStore';
import {manifest} from '../lib/Manifest';
import {MaterialIcons} from '@expo/vector-icons';

type Props = NativeStackScreenProps<HomeStackParamList, 'ScrollList'>;

const ScrollList = ({route}: Props): React.ReactElement => {
  const navigation =
    useNavigation<NativeStackNavigationProp<SearchStackParamList>>();
  const [posts, setPosts] = useState<Post[]>([]);
  const {filter} = route.params;
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEnd, setIsEnd] = useState<boolean>(false);
  const {provider} = useContentStore(state => state);
  const [viewType, setViewType] = useState<number>(1);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const fetchPosts = async () => {
      setIsLoading(true);
      const newPosts = await manifest[
        route.params.providerValue || provider.value
      ].getPosts(filter, page, provider, signal);
      if (newPosts.length === 0) {
        setIsEnd(true);
        setIsLoading(false);
        return;
      }
      setPosts(prev => [...prev, ...newPosts]);
      setIsLoading(false);
    };
    fetchPosts();
  }, [page]);

  const onEndReached = async () => {
    if (isEnd) return;
    setIsLoading(true);
    setPage(page + 1);
  };

  return (
    <View className="h-full w-full bg-black items-center p-4">
      <View className="w-full px-4 font-semibold my-6 flex-row justify-between items-center">
        <Text className="text-primary text-2xl font-bold">
          {route.params.title}
        </Text>
        <TouchableOpacity onPress={() => setViewType(viewType === 1 ? 2 : 1)}>
          <MaterialIcons
            name={viewType === 1 ? 'view-module' : 'view-list'}
            size={27}
            color="tomato"
          />
        </TouchableOpacity>
      </View>
      <View className="justify-center flex-row w-96 ">
        <FlatList
          ListFooterComponent={
            isLoading && viewType === 1 ? (
              <MotiView
                animate={{backgroundColor: 'black'}}
                //@ts-ignore
                transition={{
                  type: 'timing',
                }}
                className="flex flex-row gap-2 flex-wrap justify-center items-center mb-16">
                {[...Array(6)].map((_, i) => (
                  <View className="mx-3 gap-1 flex mb-3" key={i}>
                    <Skeleton
                      key={i}
                      show={true}
                      colorMode="dark"
                      height={150}
                      width={100}
                    />
                    <View className="h-1" />
                    <Skeleton
                      show={true}
                      colorMode="dark"
                      height={10}
                      width={100}
                    />
                  </View>
                ))}
              </MotiView>
            ) : (
              <View className="h-16" />
            )
          }
          data={posts}
          numColumns={viewType === 1 ? 3 : 1}
          key={viewType}
          contentContainerStyle={{
            width: 'auto',
            // flexDirection: 'row',
            // flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'flex-start',
          }}
          keyExtractor={(item, i) => item.title + i}
          renderItem={({item}) => (
            <TouchableOpacity
              className={
                viewType === 1
                  ? 'flex flex-col m-3'
                  : 'flex-row m-3 items-center'
              }
              onPress={() =>
                navigation.navigate('Info', {
                  link: item.link,
                  provider: route.params.providerValue || provider.value,
                  poster: item?.image,
                })
              }>
              <Image
                className="rounded-md"
                source={{
                  uri:
                    item.image ||
                    'https://placehold.jp/24/cccccc/ffffff/100x150.png?text=Vega',
                }}
                style={
                  viewType === 1
                    ? {width: 100, height: 150}
                    : {width: 70, height: 100}
                }
              />
              <Text
                className={
                  viewType === 1
                    ? 'text-white text-center truncate w-24 text-xs'
                    : 'text-white ml-3 truncate w-72 font-semibold text-base'
                }>
                {item.title.length > 24 && viewType === 1
                  ? item.title.slice(0, 24) + '...'
                  : item.title}
              </Text>
            </TouchableOpacity>
          )}
          onEndReached={onEndReached}
        />
        {!isLoading && posts.length === 0 ? (
          <View className="w-full h-full flex items-center justify-center">
            <Text className="text-white text-center font-semibold text-lg">
              Not Found
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default ScrollList;
